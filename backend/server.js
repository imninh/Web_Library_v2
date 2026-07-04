/* Librumi backend - khởi tạo app, middleware, mount routes, listen (spec §2.2). */
"use strict";
const express = require("express");
const path = require("path");
const env = require("./config/env");
const db = require("./db");
const { seed } = require("./db/seed");
const cors = require("./middleware/cors");
const { notFound, errorHandler } = require("./middleware/error");
const inv = require("./services/inventory");
const overdueAudit = require("./services/overdueAudit");

// Routers
const authRoutes = require("./modules/auth/routes");
const profileRoutes = require("./modules/profile/routes");
const booksRoutes = require("./modules/books/routes");
const commentsRoutes = require("./modules/comments/routes");
const loansRoutes = require("./modules/loans/routes");
const contactRoutes = require("./modules/contact/routes");
const statsRoutes = require("./modules/stats/routes");
const uploads = require("./modules/uploads/routes");

const app = express();
if (env.isProd) app.set("trust proxy", 1);

app.use(cors);
app.use(express.json({ limit: "6mb" }));

/* ---- Static: uploads + frontend ---- */
app.use("/uploads", express.static(uploads.UP_DIR));
const PUBLIC_DIR = path.join(__dirname, "..", "frontend-web", "public");
app.use(express.static(PUBLIC_DIR));

/* ---- Health (spec §6.9) ---- */
app.get("/api/health", async (req, res) => {
  let bookCount = 0;
  try { bookCount = (await db.get("SELECT COUNT(*) c FROM books")).c; } catch (e) {}
  res.json({ ok: true, service: "librumi", bookCount, time: new Date().toISOString() });
});

/* ---- API routes (tiền tố /api) ---- */
app.use("/api", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", booksRoutes);
app.use("/api", commentsRoutes);
app.use("/api", loansRoutes);
app.use("/api", contactRoutes);
app.use("/api", statsRoutes);
app.use("/api", uploads.router);

/* ---- 404 cho /api ---- */
app.use("/api", notFound);

/* ---- SPA fallback: mọi GET còn lại -> index.html ---- */
app.get("*", (req, res, next) => {
  if (req.path.indexOf("/api") === 0) return next();
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

/* ---- Global error handler ---- */
app.use(errorHandler);

/* ---- Khởi động ---- */
async function bootstrap() {
  await db.init();
  await seed(); // idempotent
  const allBooks = await db.query("SELECT id FROM books");
  for (const r of allBooks) await inv.syncBookAvailability(r.id);
  await overdueAudit.run();
  setInterval(() => { overdueAudit.run().catch(e => console.error("overdueAudit:", e)); }, 24 * 3600 * 1000).unref();

  app.listen(env.PORT, () => {
    console.log("────────────────────────────────────────");
    console.log(" Librumi backend đang chạy");
    console.log("   http://localhost:" + env.PORT);
    console.log("   Health: http://localhost:" + env.PORT + "/api/health");
    console.log("   DB adapter: " + db.adapter + "  | env: " + env.NODE_ENV);
    console.log("   Demo: admin/admin123 · user/user123");
    console.log("────────────────────────────────────────");
  });
}

bootstrap().catch(e => { console.error("Bootstrap failed:", e); process.exit(1); });

module.exports = app;
