/* Tồn kho suy diễn & điều hoà bản sao (spec §7.3, §7.4) - async cho Postgres. */
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
    if (targetTotal < held) {
      const err = new Error("Cannot reduce stock: " + held + " copies are currently held/borrowed.");
      err.status = 400; throw err;
    }
    const toRemove = current - targetTotal;
    const rows = await db.query("SELECT id FROM book_copies WHERE book_id = ? AND status = 'available' ORDER BY id DESC LIMIT ?", [bookId, toRemove]);
    for (const r of rows) await db.run("DELETE FROM book_copies WHERE id = ?", [r.id]);
  }
  return await syncBookAvailability(bookId);
}

module.exports = { genCopyCode, addCopies, syncBookAvailability, reconcileBookCopies };
