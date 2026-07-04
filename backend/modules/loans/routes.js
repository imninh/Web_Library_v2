/* Phiếu mượn (spec §6.5, §7.1, §7.2) — async cho Postgres. */
"use strict";
const express = require("express");
const db = require("../../db");
const env = require("../../config/env");
const { requireAuth, requireAdmin } = require("../../middleware/auth");
const inv = require("../../services/inventory");
const overdueAudit = require("../../services/overdueAudit");

const router = express.Router();

async function loanView(l) {
  const b = await db.get("SELECT title FROM books WHERE id = ?", [l.book_id]);
  l.book_title = b ? b.title : null;
  return l;
}

/* POST /api/loans (user) — gửi yêu cầu mượn (§7.2) */
router.post("/loans", requireAuth, async (req, res, next) => {
  try {
    await overdueAudit.run();
    const user = req.user;
    const items = Array.isArray(req.body.items) ? req.body.items : null;
    const due_date = req.body.due_date;
    if (!items || !items.length || !due_date) return res.status(400).json({ error: "Book list and due date are required." });
    if (!user.profile_complete) return res.status(403).json({ error: "Please complete your reader profile before borrowing." });

    await overdueAudit.syncAccountStatus(user.id);
    const status = await db.get("SELECT account_status FROM user_profiles WHERE user_id = ?", [user.id]);
    if (status && status.account_status === "blocked")
      return res.status(403).json({ error: "Your account is locked due to overdue books." });

    if (String(due_date) <= overdueAudit.todayISO())
      return res.status(400).json({ error: "Due date must be after today." });

    const ids = [...new Set(items.map(it => parseInt(it.id, 10)).filter(Boolean))];
    if (!ids.length) return res.status(400).json({ error: "Invalid book list." });

    for (const id of ids) {
      if (!(await db.get("SELECT id FROM books WHERE id = ?", [id])))
        return res.status(400).json({ error: "A book does not exist (id " + id + ")." });
      const dup = await db.get("SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status IN ('pending','borrowing','overdue')", [user.id, id]);
      if (dup) return res.status(400).json({ error: "You already have an active request for one of these books." });
    }
    if (env.MAX_ACTIVE_LOANS > 0) {
      const active = (await db.get("SELECT COUNT(*) c FROM loans WHERE user_id = ? AND status IN ('pending','borrowing','overdue')", [user.id])).c;
      if (active + ids.length > env.MAX_ACTIVE_LOANS)
        return res.status(400).json({ error: "Exceeds the maximum number of loans (" + env.MAX_ACTIVE_LOANS + ")." });
    }

    const created = await db.tx(async () => {
      const out = [];
      for (const id of ids) {
        const { lastId } = await db.run(
          "INSERT INTO loans (book_id, user_id, borrower_name, library_card_id, status, due_date) VALUES (?, ?, ?, ?, 'pending', ?)",
          [id, user.id, user.full_name, user.library_card_id, due_date]);
        out.push(lastId);
      }
      return out;
    });
    res.status(201).json({ success: true, created: created.length });
  } catch (e) { next(e); }
});

/* GET /api/loans/me (user) */
router.get("/loans/me", requireAuth, async (req, res, next) => {
  try {
    await overdueAudit.run();
    const rows = await db.query("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
    const items = [];
    for (const r of rows) items.push(await loanView(r));
    res.json({ items });
  } catch (e) { next(e); }
});

/* GET /api/admin/loans (admin) — ưu tiên pending, overdue */
router.get("/admin/loans", requireAdmin, async (req, res, next) => {
  try {
    await overdueAudit.run();
    const rows = await db.query(
      "SELECT * FROM loans ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'overdue' THEN 1 WHEN 'borrowing' THEN 2 ELSE 3 END, created_at DESC"
    );
    const items = [];
    for (const r of rows) items.push(await loanView(r));
    res.json({ items });
  } catch (e) { next(e); }
});

/* PATCH /api/admin/loans/:id/status (admin) — duyệt/từ chối/trả (§7.1) */
router.patch("/admin/loans/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const loan = await db.get("SELECT * FROM loans WHERE id = ?", [req.params.id]);
    if (!loan) return res.status(404).json({ error: "Loan not found." });
    let target = String(req.body.status || "");
    if (target === "approved") target = "borrowing";

    if (target === "borrowing") {
      if (loan.status !== "pending") return res.status(400).json({ error: "Only pending requests can be approved." });
      const prof = await db.get("SELECT full_name, library_card_id, email, account_status FROM user_profiles WHERE user_id = ?", [loan.user_id]);
      if (!prof || !prof.full_name || !prof.library_card_id || !prof.email)
        return res.status(400).json({ error: "The borrower's profile is incomplete." });
      if (prof.account_status === "blocked")
        return res.status(400).json({ error: "The borrower's account is locked." });
      const copy = await db.get("SELECT id FROM book_copies WHERE book_id = ? AND status = 'available' ORDER BY id LIMIT 1", [loan.book_id]);
      if (!copy) return res.status(400).json({ error: "No available copies for this book." });
      await db.tx(async () => {
        await db.run("UPDATE book_copies SET status = 'borrowing' WHERE id = ?", [copy.id]);
        await db.run("UPDATE loans SET status='borrowing', book_copy_id=?, approved_at=datetime('now'), borrowed_at=datetime('now') WHERE id=?", [copy.id, loan.id]);
        await inv.syncBookAvailability(loan.book_id);
      });
    } else if (target === "rejected") {
      if (loan.status !== "pending") return res.status(400).json({ error: "Only pending requests can be rejected." });
      await db.run("UPDATE loans SET status='rejected', rejection_reason=? WHERE id=?", [String(req.body.reason || "").slice(0, 300), loan.id]);
    } else if (target === "returned") {
      if (loan.status !== "borrowing" && loan.status !== "overdue")
        return res.status(400).json({ error: "Only borrowed or overdue loans can be returned." });
      await db.tx(async () => {
        if (loan.book_copy_id) await db.run("UPDATE book_copies SET status='available' WHERE id=?", [loan.book_copy_id]);
        await db.run("UPDATE loans SET status='returned', returned_at=datetime('now') WHERE id=?", [loan.id]);
        await db.run("UPDATE books SET borrow_count = borrow_count + 1 WHERE id = ?", [loan.book_id]);
        await inv.syncBookAvailability(loan.book_id);
      });
      await overdueAudit.syncAccountStatus(loan.user_id);
    } else {
      return res.status(400).json({ error: "Invalid status." });
    }
    const refreshed = await db.get("SELECT * FROM loans WHERE id = ?", [loan.id]);
    res.json({ success: true, loan: await loanView(refreshed) });
  } catch (e) { next(e); }
});

/* DELETE /api/admin/loans/:id (admin) — không xoá phiếu đang mượn/quá hạn */
router.delete("/admin/loans/:id", requireAdmin, async (req, res, next) => {
  try {
    const loan = await db.get("SELECT status FROM loans WHERE id = ?", [req.params.id]);
    if (!loan) return res.status(404).json({ error: "Loan not found." });
    if (loan.status === "borrowing" || loan.status === "overdue")
      return res.status(400).json({ error: "Cannot delete a borrowed/overdue loan." });
    await db.run("DELETE FROM loans WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

/* POST /api/admin/overdue-audit (admin) — chạy thủ công */
router.post("/admin/overdue-audit", requireAdmin, async (req, res, next) => {
  try { res.json(await overdueAudit.run()); } catch (e) { next(e); }
});

module.exports = router;
