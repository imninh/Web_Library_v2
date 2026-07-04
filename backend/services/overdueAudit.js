/* Quét quá hạn & đồng bộ khoá tài khoản (spec §7.5, §8) — async cho Postgres. */
"use strict";
const db = require("../db");

function todayISO() { return new Date().toISOString().slice(0, 10); }

async function run() {
  const today = todayISO();
  const overdueLoans = await db.query(
    "SELECT id, book_copy_id FROM loans WHERE status = 'borrowing' AND due_date IS NOT NULL AND due_date < ?",
    [today]
  );
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
  const overdue = (await db.get(
    "SELECT COUNT(*) c FROM loans WHERE user_id = ? AND status = 'overdue'", [userId]
  )).c;
  const status = overdue > 0 ? "blocked" : "active";
  await db.run("UPDATE user_profiles SET account_status = ?, updated_at = datetime('now') WHERE user_id = ?", [status, userId]);
  return status;
}

module.exports = { run, syncAccountStatus, todayISO };
