/* Băm & so khớp mật khẩu bằng PBKDF2-SHA256 - TỰ VIẾT bằng module `crypto`.
   Định dạng lưu: pbkdf2_sha256$<iterations>$<salt_base64>$<hash_base64>  (spec §5.1) */
"use strict";
const crypto = require("crypto");

const ITERATIONS = 120000;
const KEYLEN = 32;
const DIGEST = "sha256";

function hash(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, KEYLEN, DIGEST);
  return "pbkdf2_sha256$" + ITERATIONS + "$" + salt.toString("base64") + "$" + derived.toString("base64");
}

function verify(password, stored) {
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;
    const iterations = parseInt(parts[1], 10);
    const salt = Buffer.from(parts[2], "base64");
    const expected = Buffer.from(parts[3], "base64");
    const derived = crypto.pbkdf2Sync(String(password), salt, iterations, expected.length, DIGEST);
    // so sánh hằng thời gian
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch (e) {
    return false;
  }
}

module.exports = { hash, verify };
