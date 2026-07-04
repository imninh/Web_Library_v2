/* Upload ảnh bìa (spec §6.8) - nhận base64 data-URI trong JSON (không dùng Multer).
   Chỉ image/jpeg|png|webp|gif, <= 5MB. Lưu vào <DATA_DIR>/uploads, trả { url }. */
"use strict";
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const env = require("../../config/env");
const { requireAdmin } = require("../../middleware/auth");
const { rateLimit } = require("../../middleware/rateLimit");

const router = express.Router();
const uploadLimiter = rateLimit({ name: "upload", windowMs: 10 * 60 * 1000, max: 20 });
const UP_DIR = path.join(env.DATA_DIR, "uploads");
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 5 * 1024 * 1024;

router.post("/admin/upload", requireAdmin, uploadLimiter, (req, res, next) => {
  try {
    const data = String(req.body.image || req.body.data || "");
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(data);
    if (!m) return res.status(400).json({ error: "Image must be a valid data-URI (jpeg/png/webp/gif)." });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > MAX) return res.status(400).json({ error: "Image exceeds 5MB." });
    const name = crypto.randomBytes(10).toString("hex") + "." + EXT[m[1]];
    fs.writeFileSync(path.join(UP_DIR, name), buf);
    res.status(201).json({ url: "/uploads/" + name });
  } catch (e) { next(e); }
});

module.exports = { router, UP_DIR };
