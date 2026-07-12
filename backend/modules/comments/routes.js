/* Bình luận & đánh giá - async cho Postgres. */
"use strict";
const express = require("express");
const db = require("../../db");
const validate = require("../../utils/validate");
const { requireAdmin } = require("../../middleware/auth");
const { rateLimit } = require("../../middleware/rateLimit");

const router = express.Router();
const commentLimiter = rateLimit({ name: "comment", windowMs: 10 * 60 * 1000, max: 10 });

/* GET /api/books/:id/comments - công khai (hidden=0) */
router.get("/books/:id/comments", async (req, res, next) => {
  try {
    const items = await db.query(
      "SELECT id, book_id, name, content, rating, created_at FROM comments WHERE book_id = ? AND hidden = 0 ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json({ items });
  } catch (e) { next(e); }
});

/* POST /api/books/:id/comments - gửi bình luận (khách) */
router.post("/books/:id/comments", commentLimiter, async (req, res, next) => {
  try {
    const bookId = req.params.id;
    if (!(await db.get("SELECT id FROM books WHERE id = ?", [bookId])))
      return res.status(404).json({ error: "Book not found." });

    const name = validate.cleanText(req.body.name, 80);
    const email = validate.cleanText(req.body.email, 120);
    const content = validate.cleanText(req.body.content, 4000);
    const rating = validate.toInt(req.body.rating, 0);

    if (!name || !email) return res.status(400).json({ error: "Name and email are required." });
    if (!validate.isEmail(email)) return res.status(400).json({ error: "Invalid email." });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5." });
    if (content.length < 100) return res.status(400).json({ error: "Comment must be at least 100 characters." });
    if (validate.hasBannedWord(content)) return res.status(400).json({ error: "Content contains disallowed words." });

    const { lastId } = await db.run(
      "INSERT INTO comments (book_id, name, email, content, rating, hidden) VALUES (?, ?, ?, ?, ?, 0)",
      [bookId, name, email, content, rating]
    );
    const c = await db.get("SELECT id, book_id, name, content, rating, created_at FROM comments WHERE id = ?", [lastId]);
    res.status(201).json(c);
  } catch (e) { next(e); }
});

/* GET /api/reviews - review công khai mới nhất trên toàn site + tóm tắt (khách) */
router.get("/reviews", async (req, res, next) => {
  try {
    const limit = validate.clampInt(req.query.limit, 1, 30, 9);
    const items = await db.query(
      "SELECT c.id, c.name, c.rating, c.content, c.created_at, b.id AS book_id, b.title AS book_title " +
      "FROM comments c JOIN books b ON b.id = c.book_id WHERE c.hidden = 0 ORDER BY c.created_at DESC LIMIT ?",
      [limit]
    );
    const agg = await db.get("SELECT COUNT(*) n, ROUND(AVG(rating), 1)::float avg FROM comments WHERE hidden = 0");
    res.json({ items, summary: { count: agg.n || 0, average: agg.avg || 0 } });
  } catch (e) { next(e); }
});

/* GET /api/admin/comments (admin) - toàn bộ */
router.get("/admin/comments", requireAdmin, async (req, res, next) => {
  try {
    const where = [], params = [];
    if (req.query.book_id) { where.push("book_id = ?"); params.push(req.query.book_id); }
    if (req.query.rating) { where.push("rating = ?"); params.push(validate.toInt(req.query.rating, 0)); }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const order = req.query.sort === "oldest" ? "ASC" : "DESC";
    const items = await db.query(
      "SELECT c.*, b.title AS book_title FROM comments c JOIN books b ON b.id=c.book_id " + whereSql + " ORDER BY c.created_at " + order,
      params
    );
    res.json({ items });
  } catch (e) { next(e); }
});

/* PATCH /api/comments/:id/visibility (admin) - ẩn/hiện */
router.patch("/comments/:id/visibility", requireAdmin, async (req, res, next) => {
  try {
    const c = await db.get("SELECT id FROM comments WHERE id = ?", [req.params.id]);
    if (!c) return res.status(404).json({ error: "Comment not found." });
    const hidden = req.body.hidden ? 1 : 0;
    await db.run("UPDATE comments SET hidden = ? WHERE id = ?", [hidden, req.params.id]);
    res.json({ success: true, hidden: !!hidden });
  } catch (e) { next(e); }
});

/* DELETE /api/comments/:id (admin) */
router.delete("/comments/:id", requireAdmin, async (req, res, next) => {
  try {
    const c = await db.get("SELECT id FROM comments WHERE id = ?", [req.params.id]);
    if (!c) return res.status(404).json({ error: "Comment not found." });
    await db.run("DELETE FROM comments WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
