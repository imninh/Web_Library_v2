/* Hồ sơ bạn đọc (spec §6.2) - async cho Postgres. */
"use strict";
const express = require("express");
const db = require("../../db");
const validate = require("../../utils/validate");
const { requireAuth, loadUser } = require("../../middleware/auth");
const overdueAudit = require("../../services/overdueAudit");

const router = express.Router();

router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    await overdueAudit.syncAccountStatus(req.user.id);
    res.json({ profile: await loadUser(req.user.id) });
  } catch (e) { next(e); }
});

router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const full_name = validate.cleanText(req.body.full_name, 120);
    const card = validate.cleanText(req.body.library_card_id, 60);
    const email = validate.cleanText(req.body.email, 120);
    if (!full_name || !card || !email)
      return res.status(400).json({ error: "Full name, library card ID and email are required." });
    if (!validate.isEmail(email))
      return res.status(400).json({ error: "Invalid email." });
    const dup = await db.get("SELECT user_id FROM user_profiles WHERE library_card_id = ? AND user_id != ?", [card, req.user.id]);
    if (dup) return res.status(400).json({ error: "Library card ID is already used by someone else." });

    const exists = await db.get("SELECT id FROM user_profiles WHERE user_id = ?", [req.user.id]);
    if (exists) {
      await db.run("UPDATE user_profiles SET full_name=?, library_card_id=?, email=?, updated_at=datetime('now') WHERE user_id=?",
        [full_name, card, email, req.user.id]);
    } else {
      await db.run("INSERT INTO user_profiles (user_id, full_name, library_card_id, email) VALUES (?, ?, ?, ?)",
        [req.user.id, full_name, card, email]);
    }
    const user = await loadUser(req.user.id);
    res.json({ profile: user, profile_complete: user.profile_complete, account_status: user.account_status });
  } catch (e) { next(e); }
});

module.exports = router;
