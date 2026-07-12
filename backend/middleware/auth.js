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
    profile_complete: complete,
    current_borrow_count: active,
    overdue_count: overdue
  };
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    const payload = token && tokenUtil.verify(token);
    if (!payload) return res.status(401).json({ error: "Not signed in or your session has expired." });
    const user = await loadUser(payload.sub);
    if (!user) return res.status(401).json({ error: "Account does not exist." });
    req.user = user;
    next();
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
