/* Auth endpoints (spec §6.1) — async cho Postgres. */
"use strict";
const express = require("express");
const db = require("../../db");
const password = require("../../utils/password");
const tokenUtil = require("../../utils/token");
const validate = require("../../utils/validate");
const cookies = require("../../middleware/cookies");
const { optionalAuth, loadUser } = require("../../middleware/auth");
const { rateLimit } = require("../../middleware/rateLimit");
const overdueAudit = require("../../services/overdueAudit");
const env = require("../../config/env");

const router = express.Router();
const loginLimiter = rateLimit({ name: "login", windowMs: 15 * 60 * 1000, max: 20 });

function issueSession(res, userId) {
  const token = tokenUtil.create(userId);
  cookies.set(res, "librumi_token", token, { maxAgeDays: env.TOKEN_TTL_DAYS });
  return token;
}

/* POST /api/auth/register */
router.post("/auth/register", async (req, res, next) => {
  try {
    const username = validate.cleanText(req.body.username, 40);
    const pw = String(req.body.password || "");
    if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters." });
    if (pw.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
    if (await db.get("SELECT id FROM users WHERE username = ?", [username]))
      return res.status(400).json({ error: "Username already exists." });

    const { lastId } = await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')",
      [username, password.hash(pw)]);

    const full_name = validate.cleanText(req.body.full_name, 120);
    const email = validate.cleanText(req.body.email, 120);
    const card = validate.cleanText(req.body.library_card_id, 60);
    if (full_name || email || card) {
      if (card && await db.get("SELECT id FROM user_profiles WHERE library_card_id = ?", [card]))
        return res.status(400).json({ error: "Library card ID is already in use." });
      await db.run("INSERT INTO user_profiles (user_id, full_name, library_card_id, email) VALUES (?, ?, ?, ?)",
        [lastId, full_name || null, card || null, email || null]);
    } else {
      await db.run("INSERT INTO user_profiles (user_id) VALUES (?)", [lastId]);
    }

    const token = issueSession(res, lastId);
    const user = await loadUser(lastId);
    res.status(201).json({ success: true, token, user: { id: user.id, username: user.username, role: user.role }, needs_profile: !user.profile_complete, account_status: user.account_status });
  } catch (e) { next(e); }
});

/* POST /api/auth/login */
router.post("/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const username = validate.cleanText(req.body.username, 40);
    const pw = String(req.body.password || "");
    const row = await db.get("SELECT id, password FROM users WHERE username = ?", [username]);
    if (!row || !password.verify(pw, row.password))
      return res.status(401).json({ error: "Wrong username or password." });

    await overdueAudit.run();
    const token = issueSession(res, row.id);
    const user = await loadUser(row.id);
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role }, needs_profile: !user.profile_complete, account_status: user.account_status });
  } catch (e) { next(e); }
});

/* POST /api/auth/logout */
router.post("/auth/logout", (req, res) => {
  cookies.clear(res, "librumi_token");
  res.json({ success: true });
});

/* GET /api/auth/me */
router.get("/auth/me", optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ user: null });
    await overdueAudit.syncAccountStatus(req.user.id);
    res.json({ user: await loadUser(req.user.id) });
  } catch (e) { next(e); }
});

module.exports = router;
