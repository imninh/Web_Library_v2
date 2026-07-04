/* Thống kê & view (spec §6.7) — async cho Postgres. */
"use strict";
const express = require("express");
const db = require("../../db");
const { requireAdmin } = require("../../middleware/auth");

const router = express.Router();

async function getViews() {
  const r = await db.get("SELECT view_count FROM site_stats WHERE id = 1");
  return r ? r.view_count : 0;
}

router.get("/stats/views", async (req, res, next) => {
  try { res.json({ view_count: await getViews() }); } catch (e) { next(e); }
});

router.post("/stats/views", async (req, res, next) => {
  try {
    await db.run("UPDATE site_stats SET view_count = view_count + 1 WHERE id = 1");
    res.json({ view_count: await getViews() });
  } catch (e) { next(e); }
});

/* GET /api/admin/summary — dashboard (spec §6.7) */
router.get("/admin/summary", requireAdmin, async (req, res, next) => {
  try {
    const one = (sql, p = []) => db.get(sql, p);
    const summary = {
      view_count: await getViews(),
      total_books: (await one("SELECT COUNT(*) c FROM books")).c,
      total_categories: (await one("SELECT COUNT(DISTINCT category) c FROM books")).c,
      total_comments: (await one("SELECT COUNT(*) c FROM comments")).c,
      total_loans: (await one("SELECT COUNT(*) c FROM loans WHERE status IN ('borrowing','overdue','returned')")).c,
      needs_attention: {
        pending_loans: (await one("SELECT COUNT(*) c FROM loans WHERE status='pending'")).c,
        overdue_loans: (await one("SELECT COUNT(*) c FROM loans WHERE status='overdue'")).c,
        out_of_stock_books: (await one("SELECT COUNT(*) c FROM books WHERE stock = 0")).c,
        new_reviews: (await one("SELECT COUNT(*) c FROM comments WHERE created_at >= datetime('now','-7 day')")).c
      },
      top_books: await db.query("SELECT id, title, author, borrow_count FROM books ORDER BY borrow_count DESC LIMIT 5")
    };
    res.json(summary);
  } catch (e) { next(e); }
});

module.exports = router;
