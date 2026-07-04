/* Chuẩn hoá & kiểm tra đầu vào - TỰ VIẾT (spec §9.1). */
"use strict";

function cleanText(value, maxLen) {
  if (value == null) return "";
  let s = String(value).replace(/[\x00-\x1F\x7F]/g, ""); // bỏ ký tự điều khiển
  s = s.trim();
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function isEmail(v) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || "").trim());
}

function toInt(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : (def == null ? 0 : def);
}

function clampInt(v, min, max, def) {
  let n = toInt(v, def);
  if (n < min) n = min;
  if (n > max) n = max;
  return n;
}

/* Chấp nhận ảnh: data-URI ảnh, URL http(s), hoặc đường dẫn /uploads|/images */
function sanitizeImage(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
  if (/^https?:\/\/[^\s]+$/i.test(s)) return s;
  if (/^\/(uploads|images)\/[^\s]+$/.test(s)) return s;
  return "";
}

/* Lọc từ cấm (danh sách cấu hình được) */
const BANNED = ["badword1", "badword2", "spamlink"]; // demo - mở rộng khi cần
function hasBannedWord(text) {
  const t = String(text || "").toLowerCase();
  return BANNED.some(w => t.indexOf(w) >= 0);
}

module.exports = { cleanText, isEmail, toInt, clampInt, sanitizeImage, hasBannedWord };
