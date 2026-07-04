/* Liên hệ (spec §6.6) - lưu DB (async). */
"use strict";
const express = require("express");
const db = require("../../db");
const validate = require("../../utils/validate");
const { requireAdmin } = require("../../middleware/auth");
const { rateLimit } = require("../../middleware/rateLimit");

const router = express.Router();
const contactLimiter = rateLimit({ name: "contact", windowMs: 10 * 60 * 1000, max: 5 });

router.post("/contact", contactLimiter, async (req, res, next) => {
  try {
    const name = validate.cleanText(req.body.name, 80);
    const email = validate.cleanText(req.body.email, 120);
    const subject = validate.cleanText(req.body.subject, 60) || "general";
    const message = validate.cleanText(req.body.message, 4000);
    if (!name || !email || !message) return res.status(400).json({ error: "Name, email and message are required." });
    if (!validate.isEmail(email)) return res.status(400).json({ error: "Invalid email." });
    await db.run("INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)", [name, email, subject, message]);
    res.status(201).json({ success: true });
  } catch (e) { next(e); }
});

router.get("/admin/contacts", requireAdmin, async (req, res, next) => {
  try {
    res.json({ items: await db.query("SELECT * FROM contacts ORDER BY created_at DESC") });
  } catch (e) { next(e); }
});

module.exports = router;
