/* Parse & set cookie - TỰ VIẾT (không dùng cookie-parser). */
"use strict";
const env = require("../config/env");

function parse(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach(pair => {
    const i = pair.indexOf("=");
    if (i < 0) return;
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function set(res, name, value, opts = {}) {
  const parts = [name + "=" + encodeURIComponent(value)];
  parts.push("Path=/");
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  if (opts.maxAgeDays) parts.push("Max-Age=" + (opts.maxAgeDays * 24 * 3600));
  if (env.isProd) parts.push("Secure");
  appendSetCookie(res, parts.join("; "));
}

function clear(res, name) {
  appendSetCookie(res, name + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

function appendSetCookie(res, cookieStr) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) res.setHeader("Set-Cookie", cookieStr);
  else res.setHeader("Set-Cookie", [].concat(prev, cookieStr));
}

module.exports = { parse, set, clear };
