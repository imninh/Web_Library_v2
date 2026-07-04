# Kế hoạch Deploy Librumi — Render + Supabase (Postgres)

> **Mục tiêu:** đưa web Librumi lên Internet qua **Render** (1 web service serve cả API lẫn frontend), dữ liệu (sách, bình luận, URL ảnh, liên hệ, phiếu mượn, tài khoản) lưu trong **Supabase Postgres**, và hoàn thiện chức năng **đăng ký (register)**.
>
> **Ngày tạo:** 2026-07-04 · **Trạng thái hiện tại:** backend chạy SQLite (better-sqlite3) local, frontend vanilla do Express serve tĩnh.
>
> **Điểm mấu chốt:** better-sqlite3 chạy **đồng bộ**; Postgres (Supabase) chạy **bất đồng bộ**. Vì vậy phần lớn công việc là **chuyển tầng DB + các hàm gọi DB sang async/await**. Kế hoạch này đưa sẵn code cho các file khó và checklist cơ học cho phần còn lại.
>
> 💡 **Cách thực hiện nhanh:** mở một **session Claude Code mới** ngay trong thư mục `C:\Web_Lib_v2`, dán file này vào và nhờ nó "thực hiện Phase B theo checklist" — nó sẽ sửa từng file. Tự làm tay cũng được, cứ theo thứ tự Phase A → F.

---

## 0. Tổng quan kiến trúc

| | Trước (local) | Sau (production) |
|---|---|---|
| DB | SQLite file `librumi.db` | **Supabase Postgres** |
| Driver | better-sqlite3 (sync) | **pg** (async) |
| Host | `node server.js` local | **Render Web Service** |
| Frontend | Express serve `frontend-web/public` | **giống hệt** (Express serve tĩnh cùng service) |
| Ảnh bìa | upload ra ổ đĩa `uploads/` | **URL ngoài** (mặc định) hoặc **Supabase Storage** (tùy chọn) |
| Auth | cookie + Bearer token tự ký | **giống hệt** |

**Không cần đổi frontend** (trừ 1 chỉnh nhỏ ở form register). Toàn bộ thay đổi nằm ở `backend/`.

Thời lượng ước tính: Phase A ~20', Phase B ~1–2h (phần chính), Phase C ~10', Phase D ~20', Phase E ~30', Phase F ~20'.

---

## 1. Chuẩn bị

- Tài khoản: **GitHub**, **Render** (render.com, free tier), **Supabase** (supabase.com, free tier).
- Cài sẵn: Node ≥ 18, Git. (Đã có trên máy.)
- Kiểm tra: `node -v`, `git --version`.

---

## PHASE A — Tạo Supabase (Postgres + Storage)

### A1. Tạo project
1. supabase.com → **New project**. Đặt tên `librumi`, chọn **region** gần bạn (Singapore), đặt **Database Password** (lưu lại!).
2. Chờ ~2 phút cho project khởi tạo.

### A2. Lấy connection string
1. Vào **Project Settings → Database → Connection string → tab "URI"**.
2. Chọn chế độ **"Session pooler"** (khuyến nghị cho server chạy dài như Render). Chuỗi dạng:
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
3. Thay `[YOUR-PASSWORD]` bằng mật khẩu DB ở bước A1. **Đây chính là `DATABASE_URL`**. Lưu lại.

> Ghi chú: Supabase bắt buộc SSL — code adapter (Phase B) đã bật `ssl` sẵn.

### A3. (Tùy chọn) Tạo Storage bucket cho ảnh upload
> Bỏ qua bước này nếu bạn chỉ dùng **URL ảnh ngoài** (dán link ảnh vào ô "Cover image URL" khi thêm sách) — cách này chạy ngay, không cần setup gì.

1. Vào **Storage → New bucket** → tên `book-covers` → bật **Public bucket** → Create.
2. Lấy **Service role key**: Project Settings → API → `service_role` key (bí mật, chỉ dùng ở backend).
3. Lấy **Project URL**: Project Settings → API → `URL` (dạng `https://xxxx.supabase.co`).

---

## PHASE B — Chuyển backend sang Postgres (async)

> Làm tuần tự B1 → B9. Sau mỗi bước lớn nên chạy `npm start` để bắt lỗi sớm.

### B1. Đổi dependency
```bash
cd backend
npm uninstall better-sqlite3
npm install pg
# (tùy chọn, nếu dùng Supabase Storage ở A3)
npm install @supabase/supabase-js
```
Sửa `backend/package.json` phần `dependencies` thành:
```json
"dependencies": {
  "express": "^4.19.2",
  "pg": "^8.12.0"
}
```
(Thêm `"@supabase/supabase-js": "^2.45.0"` nếu dùng Storage.)

### B2. Thay `backend/db/index.js` — adapter Postgres (async)

Đây là file quan trọng nhất. Nó tự dịch cú pháp SQLite (`?`, `datetime('now')`) sang Postgres nên **các câu SQL ở route KHÔNG cần đổi**, chỉ cần thêm `await`.

**Ghi đè toàn bộ `backend/db/index.js`:**
```js
/* Adapter Postgres (Supabase) — interface async: query/get/run/tx/init.
   Tự dịch cú pháp kiểu SQLite sang Postgres để hạn chế sửa câu SQL:
   - "?"                       -> $1,$2,...
   - datetime('now')           -> now()
   - datetime('now','-7 day')  -> (now() + interval '-7 day')
   - datetime('now', ?)        -> now() + ($n)::interval
   - INSERT ... (không RETURNING) -> tự thêm "RETURNING id" để lấy lastId
*/
"use strict";
const { Pool, types } = require("pg");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

// bigint (COUNT) trả về number thay vì string
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5
});

let txClient = null; // client đang trong transaction (app đơn luồng, tải thấp)

function translate(sql) {
  sql = sql.replace(/datetime\('now',\s*'([^']+)'\)/g, (m, spec) => `(now() + interval '${spec}')`);
  sql = sql.replace(/datetime\('now',\s*\?\)/g, "now() + (?)::interval");
  sql = sql.replace(/datetime\('now'\)/g, "now()");
  let i = 0;
  sql = sql.replace(/\?/g, () => "$" + (++i));
  return sql;
}

async function query(sql, params = []) {
  const runner = txClient || pool;
  const res = await runner.query(translate(sql), params);
  return res.rows;
}
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}
async function run(sql, params = []) {
  let text = translate(sql);
  const isInsert = /^\s*insert\s/i.test(text) && !/returning/i.test(text);
  if (isInsert) text += " RETURNING id";
  const runner = txClient || pool;
  const res = await runner.query(text, params);
  return { changes: res.rowCount, lastId: isInsert && res.rows[0] ? res.rows[0].id : undefined };
}
async function tx(fn) {
  const client = await pool.connect();
  txClient = client;
  try {
    await client.query("BEGIN");
    const r = await fn();
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    txClient = null;
    client.release();
  }
}
async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
}

module.exports = { init, query, get, run, tx, pool, adapter: "postgres" };
```
> Sau bước này có thể **xóa** `backend/db/sqlite.js` và `backend/db/postgres.js` cũ (nếu có) — không dùng nữa.

### B3. Thay `backend/db/schema.sql` — cú pháp Postgres

**Ghi đè toàn bộ `backend/db/schema.sql`:**
```sql
-- Librumi schema — PostgreSQL (Supabase). Idempotent.
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name       TEXT,
  library_card_id TEXT UNIQUE,
  email           TEXT,
  account_status  TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS books (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT,
  image        TEXT,
  isbn         TEXT,
  publisher    TEXT,
  year         INTEGER,
  total_stock  INTEGER NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  borrow_count INTEGER NOT NULL DEFAULT 0,
  featured     SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS book_copies (
  id         SERIAL PRIMARY KEY,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  copy_code  TEXT UNIQUE,
  status     TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS loans (
  id               SERIAL PRIMARY KEY,
  book_id          INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_copy_id     INTEGER REFERENCES book_copies(id) ON DELETE SET NULL,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  borrower_name    TEXT NOT NULL,
  library_card_id  TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  due_date         TEXT,
  approved_at      TIMESTAMPTZ,
  borrowed_at      TIMESTAMPTZ,
  returned_at      TIMESTAMPTZ,
  overdue_at       TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  content    TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  hidden     SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT DEFAULT 'general',
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_stats (
  id         INTEGER PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0
);
INSERT INTO site_stats (id, view_count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(featured);
CREATE INDEX IF NOT EXISTS idx_copies_book   ON book_copies(book_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_user    ON loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_book    ON loans(book_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_book ON comments(book_id, hidden);
CREATE INDEX IF NOT EXISTS idx_profiles_card ON user_profiles(library_card_id);
```
> **Quan trọng:** `due_date` để **TEXT** (lưu chuỗi `'YYYY-MM-DD'`) để so sánh `due_date < ?` hoạt động như cũ. `featured`/`hidden` để **SMALLINT** (0/1) để `= 1` và `? 1 : 0` không phải đổi.

### B4. Cập nhật `backend/config/env.js`
Thêm kiểm tra `DATABASE_URL` khi dùng postgres. Tìm đoạn cuối file (chỗ throw AUTH_TOKEN_SECRET) và thêm ngay dưới:
```js
if (env.DB_ADAPTER === "postgres" && !env.DATABASE_URL) {
  throw new Error("DATABASE_URL là bắt buộc khi DB_ADAPTER=postgres (Supabase).");
}
```
Và đổi mặc định adapter (để local test Postgres): giữ nguyên `DB_ADAPTER: process.env.DB_ADAPTER || "sqlite"` — ta sẽ set `DB_ADAPTER=postgres` qua biến môi trường (file `.env` local + Render), **không sửa mặc định**.

### B5. Ghi đè `backend/services/inventory.js` (async)
```js
/* Tồn kho suy diễn & điều hoà bản sao (spec §7.3, §7.4) — async cho Postgres. */
"use strict";
const db = require("../db");

function genCopyCode(bookId) {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return "B" + bookId + "-" + rand;
}
async function addCopies(bookId, n) {
  for (let i = 0; i < n; i++) {
    let code, ok = false, tries = 0;
    while (!ok && tries < 10) {
      code = genCopyCode(bookId); tries++;
      const dup = await db.get("SELECT id FROM book_copies WHERE copy_code = ?", [code]);
      ok = !dup;
    }
    await db.run("INSERT INTO book_copies (book_id, copy_code, status) VALUES (?, ?, 'available')", [bookId, code]);
  }
}
async function syncBookAvailability(bookId) {
  const total = (await db.get("SELECT COUNT(*) c FROM book_copies WHERE book_id = ?", [bookId])).c;
  const avail = (await db.get("SELECT COUNT(*) c FROM book_copies WHERE book_id = ? AND status = 'available'", [bookId])).c;
  await db.run("UPDATE books SET total_stock = ?, stock = ? WHERE id = ?", [total, avail, bookId]);
  return { total_stock: total, stock: avail };
}
async function reconcileBookCopies(bookId, targetTotal) {
  targetTotal = Math.max(0, parseInt(targetTotal, 10) || 0);
  const current = (await db.get("SELECT COUNT(*) c FROM book_copies WHERE book_id = ?", [bookId])).c;
  if (targetTotal > current) {
    await addCopies(bookId, targetTotal - current);
  } else if (targetTotal < current) {
    const held = (await db.get("SELECT COUNT(*) c FROM book_copies WHERE book_id = ? AND status != 'available'", [bookId])).c;
    if (targetTotal < held) { const err = new Error("Cannot reduce stock: " + held + " copies are currently held/borrowed."); err.status = 400; throw err; }
    const rows = await db.query("SELECT id FROM book_copies WHERE book_id = ? AND status = 'available' ORDER BY id DESC LIMIT ?", [bookId, current - targetTotal]);
    for (const r of rows) await db.run("DELETE FROM book_copies WHERE id = ?", [r.id]);
  }
  return await syncBookAvailability(bookId);
}
module.exports = { genCopyCode, addCopies, syncBookAvailability, reconcileBookCopies };
```

### B6. Ghi đè `backend/services/overdueAudit.js` (async)
```js
/* Quét quá hạn & đồng bộ khoá tài khoản (spec §7.5, §8) — async. */
"use strict";
const db = require("../db");

function todayISO() { return new Date().toISOString().slice(0, 10); }

async function run() {
  const today = todayISO();
  const overdueLoans = await db.query(
    "SELECT id, book_copy_id FROM loans WHERE status = 'borrowing' AND due_date IS NOT NULL AND due_date < ?", [today]);
  for (const l of overdueLoans) {
    await db.run("UPDATE loans SET status = 'overdue', overdue_at = datetime('now') WHERE id = ?", [l.id]);
    if (l.book_copy_id) await db.run("UPDATE book_copies SET status = 'overdue' WHERE id = ?", [l.book_copy_id]);
  }
  const users = await db.query("SELECT user_id FROM user_profiles");
  for (const u of users) await syncAccountStatus(u.user_id);
  return { overdue_marked: overdueLoans.length };
}
async function syncAccountStatus(userId) {
  if (!userId) return;
  const overdue = (await db.get("SELECT COUNT(*) c FROM loans WHERE user_id = ? AND status = 'overdue'", [userId])).c;
  const status = overdue > 0 ? "blocked" : "active";
  await db.run("UPDATE user_profiles SET account_status = ?, updated_at = datetime('now') WHERE user_id = ?", [status, userId]);
  return status;
}
module.exports = { run, syncAccountStatus, todayISO };
```

### B7. Ghi đè `backend/middleware/auth.js` (async)
```js
/* Xác thực & phân quyền (async cho Postgres). */
"use strict";
const db = require("../db");
const tokenUtil = require("../utils/token");
const cookies = require("./cookies");

function extractToken(req) {
  const h = req.headers.authorization || "";
  if (h.indexOf("Bearer ") === 0) return h.slice(7).trim();
  const c = cookies.parse(req);
  return c.librumi_token || null;
}
async function loadUser(userId) {
  const user = await db.get("SELECT id, username, role, created_at FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  const profile = await db.get("SELECT full_name, library_card_id, email, account_status FROM user_profiles WHERE user_id = ?", [userId]);
  const active = (await db.get("SELECT COUNT(*) c FROM loans WHERE user_id = ? AND status IN ('borrowing','overdue')", [userId])).c;
  const overdue = (await db.get("SELECT COUNT(*) c FROM loans WHERE user_id = ? AND status = 'overdue'", [userId])).c;
  const complete = !!(profile && profile.full_name && profile.library_card_id && profile.email);
  return {
    id: user.id, username: user.username, role: user.role,
    full_name: profile ? profile.full_name : null,
    library_card_id: profile ? profile.library_card_id : null,
    email: profile ? profile.email : null,
    account_status: profile ? profile.account_status : "active",
    profile_complete: complete, current_borrow_count: active, overdue_count: overdue
  };
}
async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    const payload = token && tokenUtil.verify(token);
    if (!payload) return res.status(401).json({ error: "Not signed in or your session has expired." });
    const user = await loadUser(payload.sub);
    if (!user) return res.status(401).json({ error: "Account does not exist." });
    req.user = user; next();
  } catch (e) { next(e); }
}
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, function () {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only." });
    next();
  });
}
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    const payload = token && tokenUtil.verify(token);
    if (payload) { const u = await loadUser(payload.sub); if (u) req.user = u; }
    next();
  } catch (e) { next(e); }
}
module.exports = { requireAuth, requireAdmin, optionalAuth, loadUser, extractToken };
```

### B8. Ghi đè `backend/db/seed.js` (async) — giữ nguyên dữ liệu mẫu
Chỉ đổi phần thân sang async (thêm `await`, đổi `forEach` → `for...of`). Thay 2 hàm `seed()` và `ensureUser()`:
```js
async function seed() {
  await db.init();
  await ensureUser("admin", "admin123", "admin");
  await ensureUser("user", "user123", "user");

  const bookCount = (await db.get("SELECT COUNT(*) c FROM books")).c;
  if (bookCount === 0) {
    for (const b of DEMO_BOOKS) {
      await db.tx(async () => {
        const { lastId } = await db.run(
          "INSERT INTO books (title, author, category, description, year, featured) VALUES (?,?,?,?,?,?)",
          [b.title, b.author, b.category, b.description, b.year, b.featured]);
        if (b.stock > 0) await inv.addCopies(lastId, b.stock);
        await inv.syncBookAvailability(lastId);
      });
    }
    console.log("[seed] Đã tạo " + DEMO_BOOKS.length + " sách mẫu kèm bản sao.");
  }

  if ((await db.get("SELECT COUNT(*) c FROM comments")).c === 0) {
    const books = await db.query("SELECT id FROM books ORDER BY id");
    if (books.length) {
      const pick = i => books[i % books.length].id;
      for (let i = 0; i < DEMO_REVIEWS.length; i++) {
        const r = DEMO_REVIEWS[i];
        await db.run(
          "INSERT INTO comments (book_id, name, email, content, rating, hidden, created_at) VALUES (?,?,?,?,?,0, datetime('now', ?))",
          [pick(i), r.name, r.email, r.content, r.rating, "-" + r.daysAgo + " days"]);
      }
      console.log("[seed] Đã tạo " + DEMO_REVIEWS.length + " review mẫu.");
    }
  }

  const allBooks = await db.query("SELECT id FROM books");
  for (const r of allBooks) await inv.syncBookAvailability(r.id);
  console.log("[seed] Hoàn tất. Tài khoản demo: admin/admin123, user/user123.");
}

async function ensureUser(username, pw, role) {
  const existing = await db.get("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) {
    if (role === "user" && !(await db.get("SELECT id FROM user_profiles WHERE user_id = ?", [existing.id])))
      await db.run("INSERT INTO user_profiles (user_id) VALUES (?)", [existing.id]);
    return existing.id;
  }
  const { lastId } = await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, password.hash(pw), role]);
  await db.run("INSERT INTO user_profiles (user_id, account_status) VALUES (?, 'active')", [lastId]);
  console.log("[seed] Tạo tài khoản " + username + " (" + role + ").");
  return lastId;
}
```
Cuối file, phần chạy trực tiếp đổi thành:
```js
module.exports = { seed };
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
```

### B9. Sửa `backend/server.js` — `bootstrap` async
Thay hàm `bootstrap()` (giữ nguyên phần khai báo app/route phía trên) bằng:
```js
async function bootstrap() {
  await db.init();
  await seed();
  const allBooks = await db.query("SELECT id FROM books");
  for (const r of allBooks) await inv.syncBookAvailability(r.id);
  await overdueAudit.run();
  setInterval(() => { overdueAudit.run().catch(e => console.error("overdueAudit:", e)); }, 24 * 3600 * 1000).unref();

  app.listen(env.PORT, () => {
    console.log("Librumi backend on http://localhost:" + env.PORT + "  | DB: " + db.adapter + " | " + env.NODE_ENV);
    console.log("Demo: admin/admin123 · user/user123");
  });
}
bootstrap().catch(e => { console.error("Bootstrap failed:", e); process.exit(1); });
```

### B10. Sửa các route: thêm `async` + `await` (phần cơ học)

**Quy tắc chung cho MỌI file trong `backend/modules/**/routes.js`:**
1. Đổi handler `(req, res, next) => {` thành `async (req, res, next) => {`.
2. Thêm `await` trước **mọi** lời gọi: `db.get(...)`, `db.query(...)`, `db.run(...)`, `db.tx(...)`, `inv.xxx(...)`, `overdueAudit.xxx(...)`, `loadUser(...)`.
3. Với `db.tx(() => { ... })`: đổi thành `await db.tx(async () => { ... })` và thêm `await` cho các lệnh bên trong.
4. Câu SQL **giữ nguyên** (adapter tự dịch `?` và `datetime('now')`).

**Checklist theo file** (đánh dấu ✅ khi xong):

- [ ] `modules/auth/routes.js` — `async` cho handler `register`, `login`, `me`. `await` cho `db.get/db.run`, `await loadUser(...)`, `await overdueAudit.run()`, `await overdueAudit.syncAccountStatus(...)`. (`logout` không có DB, để nguyên.) `issueSession` không async.
- [ ] `modules/profile/routes.js` — `async` cho `get /profile`, `put /profile`. `await` DB + `await loadUser(...)` + `await overdueAudit.syncAccountStatus(...)`.
- [ ] `modules/books/routes.js` — `async` tất cả handler. **2 chỗ `db.tx`** (POST và PUT): đổi `db.tx(() => {...})` → `await db.tx(async () => { ... await db.run(...); await inv.addCopies(...); await inv.syncBookAvailability(...); ... })`. `await` mọi `db.*` và `inv.*`.
  - **Thêm `::float`**: tìm hằng `RATING_SELECT`, đổi `ROUND(AVG(rating),1) AS rating` → `ROUND(AVG(rating),1)::float AS rating` (để điểm trung bình trả về số, không phải chuỗi).
- [ ] `modules/comments/routes.js` — `async` tất cả handler; `await` DB.
  - Ở route `GET /reviews`: đổi `ROUND(AVG(rating), 1) avg` → `ROUND(AVG(rating), 1)::float avg`.
- [ ] `modules/loans/routes.js` — `async` tất cả handler; `await overdueAudit.run()/syncAccountStatus()`, `await db.*`, `await inv.syncBookAvailability(...)`. **3 chỗ `db.tx`** → `await db.tx(async () => { ... })` với `await` bên trong.
- [ ] `modules/contact/routes.js` — `async`; `await` DB.
- [ ] `modules/stats/routes.js` — đổi `function getViews()` → `async function getViews()` với `await db.get`; mọi nơi gọi `getViews()` thêm `await`. `async` cho các handler; `await` DB.
- [ ] `modules/uploads/routes.js` — nếu giữ upload ra đĩa thì để nguyên (nhưng xem B11). Nếu dùng Supabase Storage, thay theo B11.

> 💡 Mẹo bắt lỗi sót `await`: nếu API trả về `{}` rỗng hoặc lỗi `Cannot read properties of undefined`, gần như chắc chắn thiếu một `await` trước `db.*`.

### B11. Ảnh bìa sách

**Mặc định (khuyến nghị, không cần setup):** khi thêm/sửa sách ở trang Admin, dán **URL ảnh công khai** vào ô *"Cover image URL"*. URL đó lưu vào cột `books.image` (Supabase) và frontend hiển thị ngay. **Không cần đổi code.**

**Tùy chọn — upload file lên Supabase Storage** (nếu muốn upload ảnh thật, vì ổ đĩa Render là tạm thời): ghi đè `modules/uploads/routes.js`:
```js
"use strict";
const express = require("express");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const env = require("../../config/env");
const { requireAdmin } = require("../../middleware/auth");
const { rateLimit } = require("../../middleware/rateLimit");

const router = express.Router();
const uploadLimiter = rateLimit({ name: "upload", windowMs: 10 * 60 * 1000, max: 20 });
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 5 * 1024 * 1024;

router.post("/admin/upload", requireAdmin, uploadLimiter, async (req, res, next) => {
  try {
    const data = String(req.body.image || req.body.data || "");
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(data);
    if (!m) return res.status(400).json({ error: "Image must be a valid data-URI (jpeg/png/webp/gif)." });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > MAX) return res.status(400).json({ error: "Image exceeds 5MB." });
    const name = crypto.randomBytes(10).toString("hex") + "." + EXT[m[1]];
    const { error } = await supabase.storage.from(env.SUPABASE_BUCKET).upload(name, buf, { contentType: m[1], upsert: false });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(name);
    res.status(201).json({ url: pub.publicUrl });
  } catch (e) { next(e); }
});
module.exports = { router, UP_DIR: null };
```
Trong `server.js`, dòng `app.use("/uploads", express.static(uploads.UP_DIR));` sẽ lỗi vì `UP_DIR = null` → **xóa dòng đó** (ảnh giờ nằm trên Supabase, không serve từ đĩa nữa).
Thêm vào `config/env.js`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || "book-covers"`.

### B12. Test local với Supabase
Tạo `backend/.env` (KHÔNG commit file này):
```
NODE_ENV=development
DB_ADAPTER=postgres
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-...pooler.supabase.com:5432/postgres
AUTH_TOKEN_SECRET=dev-secret-123
# (nếu dùng Storage)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_BUCKET=book-covers
```
> Node ≥ 20.6 tự đọc `.env` với cờ `--env-file`. Chạy:
```bash
cd backend
node --env-file=.env server.js
```
> Hoặc cài `npm i dotenv` và thêm `require("dotenv").config();` ở **dòng đầu** `server.js`.

Kỳ vọng log: `Librumi backend on ... | DB: postgres`. Mở http://localhost:4000, kiểm tra Home hiện sách + review (lần đầu app tự tạo bảng + seed vào Supabase).

Kiểm tra nhanh:
```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/books
```

---

## PHASE C — Chức năng Đăng ký (Register)

Register **đã hoạt động sẵn**: backend có `POST /api/auth/register` (tạo user + hồ sơ nếu gửi kèm), frontend có tab **Register** trong trang đăng nhập. Sau Phase B, đăng ký sẽ lưu thẳng vào Supabase.

**Kiểm tra:** vào `/#/login` → tab **Register** → nhập username/mật khẩu → tạo tài khoản → tự đăng nhập vào `/#/account`.

**Nâng cấp (tùy chọn) — thu thập email ngay khi đăng ký** để hồ sơ đầy đủ hơn. Trong `frontend-web/public/js/pages/auth.js`:
1. Thêm ô email vào form register (ngay dưới ô Full name):
```js
'        <div class="form-row"><label class="field-lbl">Email (optional)</label><input class="inp" name="email" type="email"/></div>' +
```
2. Sửa lời gọi register để gửi kèm email:
```js
await window.Store.register({ username: u, password: p, full_name: reg.full_name.value.trim() || undefined, email: reg.email.value.trim() || undefined });
```
Backend `register` đã nhận `email`/`library_card_id`/`full_name` và tạo hồ sơ — không cần sửa thêm.

---

## PHASE D — Đưa code lên GitHub

### D1. Tạo `.gitignore` ở gốc `C:\Web_Lib_v2`
```gitignore
node_modules/
backend/node_modules/
backend/librumi.db*
backend/uploads/
**/.env
.DS_Store
*.log
```
> **Giữ lại** `frontend-web/public/assets/*.webm` (video hero) để deploy — trừ khi bạn chuyển video sang host ngoài (xem Gotchas).

### D2. Khởi tạo git + commit
```bash
cd /c/Web_Lib_v2   # hoặc: cd C:\Web_Lib_v2 (PowerShell)
git init
git add .
git commit -m "Librumi: web + backend, chuyển Postgres/Supabase, sẵn sàng deploy"
```

### D3. Tạo repo GitHub và push
1. github.com → **New repository** → tên `librumi` → **Private** (khuyến nghị) → Create (đừng thêm README).
2. Chạy (thay `<USER>`):
```bash
git branch -M main
git remote add origin https://github.com/<USER>/librumi.git
git push -u origin main
```

---

## PHASE E — Deploy lên Render

### E1. Tạo Web Service
1. render.com → **New → Web Service** → **Build and deploy from a Git repository** → kết nối GitHub, chọn repo `librumi`.
2. Cấu hình:
   - **Name:** `librumi`
   - **Root Directory:** `backend`   ← quan trọng
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
   - **Health Check Path:** `/api/health`

### E2. Đặt Environment Variables (tab Environment)
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DB_ADAPTER` | `postgres` |
| `DATABASE_URL` | *(chuỗi Session pooler từ A2)* |
| `AUTH_TOKEN_SECRET` | *(chuỗi ngẫu nhiên dài — xem dưới)* |
| `CORS_ORIGINS` | `https://librumi.onrender.com` *(URL Render của bạn — điền sau khi biết, hoặc để `*` tạm)* |
| `SUPABASE_URL` | *(chỉ nếu dùng Storage)* |
| `SUPABASE_SERVICE_KEY` | *(chỉ nếu dùng Storage)* |
| `SUPABASE_BUCKET` | `book-covers` *(nếu dùng Storage)* |

Tạo secret ngẫu nhiên:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### E3. Deploy
- Bấm **Create Web Service**. Render sẽ `npm install` + `npm start`. Lần chạy đầu, app tự tạo bảng + seed vào Supabase.
- Xem tab **Logs**, chờ dòng `Librumi backend on ... | DB: postgres`.
- Mở URL Render (vd `https://librumi.onrender.com`). Sau khi biết URL, quay lại **E2 sửa `CORS_ORIGINS`** thành đúng URL đó rồi **Save** (Render tự deploy lại).

> Free tier Render "ngủ" sau 15 phút không truy cập → request đầu tiên chậm ~30–50s (bình thường).

---

## PHASE F — Kiểm thử production (checklist)

- [ ] `https://.../api/health` → `{ "ok": true, "bookCount": 6, ... }`
- [ ] Trang chủ hiện sách + review, hero video chạy.
- [ ] **Register**: tạo tài khoản mới → đăng nhập được.
- [ ] Đăng nhập `admin/admin123` → trang Admin → thêm 1 sách (dán URL ảnh) → sách hiện ở Catalog.
- [ ] Gửi **bình luận** ≥100 ký tự ở trang sách → hiện công khai → lên mục "Loved by our readers".
- [ ] Gửi **liên hệ** ở trang About → admin thấy trong tab Contacts.
- [ ] Đặt **mượn** (user, hồ sơ đầy đủ) → admin **Approve** → tồn kho giảm.
- [ ] Vào Supabase → **Table Editor** → thấy dữ liệu trong `books`, `comments`, `contacts`, `users`, `loans`.
- [ ] Refresh trang admin nhiều lần → view count tăng (dữ liệu bền vững, không mất khi Render restart).

---

## Bảng biến môi trường (tóm tắt)

| Biến | Bắt buộc | Ý nghĩa |
|---|:---:|---|
| `NODE_ENV` | prod | `production` bật cookie Secure + trust proxy |
| `DB_ADAPTER` | ✅ | đặt `postgres` |
| `DATABASE_URL` | ✅ | chuỗi kết nối Supabase (Session pooler) |
| `AUTH_TOKEN_SECRET` | ✅ (prod) | khóa ký token — chuỗi ngẫu nhiên |
| `CORS_ORIGINS` | nên | URL production (cho mobile app sau này) |
| `PORT` | không | Render tự set |
| `MAX_ACTIVE_LOANS` | không | mặc định 5 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_BUCKET` | tùy chọn | chỉ khi dùng Storage upload ảnh |

---

## Gotchas & lưu ý

1. **Thiếu `await`** là lỗi phổ biến nhất sau chuyển async → API trả rỗng/`undefined`. Rà lại checklist B10.
2. **COUNT trả chuỗi:** adapter đã set parser cho bigint → COUNT là số. Điểm trung bình dùng `::float` (B10).
3. **SSL Supabase:** adapter đã bật `ssl:{rejectUnauthorized:false}`. Nếu lỗi SSL, thêm `?sslmode=require` vào cuối `DATABASE_URL`.
4. **Pooler vs Direct:** dùng **Session pooler** (port 5432) cho Render. Nếu gặp lỗi "too many connections", giữ `max: 5` trong Pool (đã set).
5. **Video hero 30MB** làm repo nặng, deploy chậm. Tùy chọn: upload 2 file `assets/*.webm` lên Supabase Storage (bucket public) rồi sửa `src` trong `frontend-web/public/js/pages/home.js` trỏ tới URL Supabase, và bỏ 2 file khỏi git.
6. **Reset dữ liệu demo:** xóa các bảng trong Supabase (SQL Editor: `DROP TABLE ... CASCADE;`) rồi restart Render — app seed lại. Hoặc chỉ xóa rows.
7. **2 môi trường:** muốn tách dev/prod, tạo **2 project Supabase** (một cho local `.env`, một cho Render).
8. **Bảo mật:** không commit `.env`, không để `AUTH_TOKEN_SECRET` mặc định ở prod, đặt `CORS_ORIGINS` đúng domain.

---

## Sau khi web chạy: Mobile app

Backend đã sẵn sàng cho mobile (mọi endpoint nhận `Authorization: Bearer <token>`). App React Native/Expo chỉ cần:
- `BASE_URL = https://librumi.onrender.com/api`
- Đăng nhập → lưu token (SecureStore) → gửi kèm header Bearer.
- Đặt `CORS_ORIGINS` đã bao gồm domain gọi API (hoặc dùng Bearer nên không vướng cookie/CORS).

Xem lại tiêu chí mobile trong `docs/Yeu_cau_BTL.md` (màn chính, đăng nhập, nội dung, liên hệ).

---
*Hết kế hoạch. Thực hiện tuần tự A → F; test local (B12) trước khi deploy để tiết kiệm thời gian.*
