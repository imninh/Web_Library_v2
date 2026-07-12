/* Sách & danh mục - async cho Postgres. */
"use strict";
const express = require("express");
const db = require("../../db");
const validate = require("../../utils/validate");
const { requireAdmin } = require("../../middleware/auth");
const inv = require("../../services/inventory");

const router = express.Router();

/* rating trung bình + số đánh giá (chỉ comment hiển thị) */
const RATING_SELECT =
  "(SELECT ROUND(AVG(rating),1)::float FROM comments WHERE book_id=b.id AND hidden=0) AS rating, " +
  "(SELECT COUNT(*) FROM comments WHERE book_id=b.id AND hidden=0) AS rating_count";

function shape(b) {
  b.featured = !!b.featured;
  b.rating = b.rating || 0;
  return b;
}

/* GET /api/books */
router.get("/books", async (req, res, next) => {
  try {
    const where = [];
    const params = [];
    if (req.query.category && req.query.category !== "All") { where.push("b.category = ?"); params.push(String(req.query.category)); }
    if (req.query.featured) { where.push("b.featured = 1"); }
    if (req.query.search) {
      where.push("(b.title LIKE ? OR b.author LIKE ?)");
      const s = "%" + String(req.query.search) + "%"; params.push(s, s);
    }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const sortMap = { newest: "b.created_at DESC", popular: "b.borrow_count DESC", title: "b.title ASC" };
    const orderSql = "ORDER BY " + (sortMap[req.query.sort] || sortMap.newest);

    const page = validate.clampInt(req.query.page, 1, 1e6, 1);
    const limit = validate.clampInt(req.query.limit, 1, 100, 20);
    const offset = (page - 1) * limit;

    const total = (await db.get("SELECT COUNT(*) c FROM books b " + whereSql, params)).c;
    const items = (await db.query(
      "SELECT b.*, " + RATING_SELECT + " FROM books b " + whereSql + " " + orderSql + " LIMIT ? OFFSET ?",
      params.concat([limit, offset])
    )).map(shape);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

/* GET /api/categories */
router.get("/categories", async (req, res, next) => {
  try {
    const rows = await db.query("SELECT DISTINCT category FROM books ORDER BY category");
    res.json(["All"].concat(rows.map(r => r.category)));
  } catch (e) { next(e); }
});

/* GET /api/books/:id */
router.get("/books/:id", async (req, res, next) => {
  try {
    const b = await db.get("SELECT b.*, " + RATING_SELECT + " FROM books b WHERE b.id = ?", [req.params.id]);
    if (!b) return res.status(404).json({ error: "Book not found." });
    res.json(shape(b));
  } catch (e) { next(e); }
});

/* POST /api/books (admin) */
router.post("/books", requireAdmin, async (req, res, next) => {
  try {
    const title = validate.cleanText(req.body.title, 200);
    const author = validate.cleanText(req.body.author, 120);
    const category = validate.cleanText(req.body.category, 60);
    if (!title || !author || !category)
      return res.status(400).json({ error: "Title, author and category are required." });
    const stock = validate.clampInt(req.body.total_stock, 0, 10000, 0);

    const recent = await db.get(
      "SELECT b.*, " + RATING_SELECT + " FROM books b WHERE b.title = ? AND b.author = ? AND b.created_at > datetime('now','-10 seconds') ORDER BY b.id DESC LIMIT 1",
      [title, author]);
    if (recent) return res.status(200).json(shape(recent));

    const created = await db.tx(async () => {
      const { lastId } = await db.run(
        "INSERT INTO books (title, author, category, description, image, isbn, publisher, year, featured) VALUES (?,?,?,?,?,?,?,?,?)",
        [title, author, category,
          validate.cleanText(req.body.description, 4000),
          validate.sanitizeImage(req.body.image),
          validate.cleanText(req.body.isbn, 40),
          validate.cleanText(req.body.publisher, 120),
          validate.toInt(req.body.year, null),
          req.body.featured ? 1 : 0]);
      if (stock > 0) await inv.addCopies(lastId, stock);
      await inv.syncBookAvailability(lastId);
      return lastId;
    });
    const b = await db.get("SELECT b.*, " + RATING_SELECT + " FROM books b WHERE b.id = ?", [created]);
    res.status(201).json(shape(b));
  } catch (e) { next(e); }
});

/* PUT /api/books/:id (admin) */
router.put("/books/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    const b = await db.get("SELECT * FROM books WHERE id = ?", [id]);
    if (!b) return res.status(404).json({ error: "Book not found." });

    const fields = {
      title: validate.cleanText(req.body.title, 200) || b.title,
      author: validate.cleanText(req.body.author, 120) || b.author,
      category: validate.cleanText(req.body.category, 60) || b.category,
      description: req.body.description != null ? validate.cleanText(req.body.description, 4000) : b.description,
      image: req.body.image != null ? validate.sanitizeImage(req.body.image) : b.image,
      isbn: req.body.isbn != null ? validate.cleanText(req.body.isbn, 40) : b.isbn,
      publisher: req.body.publisher != null ? validate.cleanText(req.body.publisher, 120) : b.publisher,
      year: req.body.year != null ? validate.toInt(req.body.year, null) : b.year,
      featured: req.body.featured != null ? (req.body.featured ? 1 : 0) : b.featured
    };
    await db.tx(async () => {
      await db.run("UPDATE books SET title=?, author=?, category=?, description=?, image=?, isbn=?, publisher=?, year=?, featured=? WHERE id=?",
        [fields.title, fields.author, fields.category, fields.description, fields.image, fields.isbn, fields.publisher, fields.year, fields.featured, id]);
      if (req.body.total_stock != null) await inv.reconcileBookCopies(id, req.body.total_stock);
      else await inv.syncBookAvailability(id);
    });
    const out = await db.get("SELECT b.*, " + RATING_SELECT + " FROM books b WHERE b.id = ?", [id]);
    res.json(shape(out));
  } catch (e) { next(e); }
});

/* DELETE /api/books/:id (admin) - chặn nếu còn phiếu/bản sao đang hoạt động */
router.delete("/books/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    const b = await db.get("SELECT id FROM books WHERE id = ?", [id]);
    if (!b) return res.status(404).json({ error: "Book not found." });
    const activeLoans = (await db.get("SELECT COUNT(*) c FROM loans WHERE book_id = ? AND status IN ('pending','borrowing','overdue')", [id])).c;
    if (activeLoans > 0) return res.status(400).json({ error: "Cannot delete: there are active loans." });
    const heldCopies = (await db.get("SELECT COUNT(*) c FROM book_copies WHERE book_id = ? AND status != 'available'", [id])).c;
    if (heldCopies > 0) return res.status(400).json({ error: "Cannot delete: some copies are currently held." });
    await db.run("DELETE FROM books WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

/* GET /api/books/:id/copies (admin) */
router.get("/books/:id/copies", requireAdmin, async (req, res, next) => {
  try {
    const copies = await db.query("SELECT * FROM book_copies WHERE book_id = ? ORDER BY id", [req.params.id]);
    res.json({ items: copies });
  } catch (e) { next(e); }
});

module.exports = router;
