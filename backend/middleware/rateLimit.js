/* Rate limit theo IP+path — TỰ VIẾT (không dùng express-rate-limit). Spec §10.
   Bộ nhớ trong (đủ cho BTL). Vượt ngưỡng trả 429. */
"use strict";

const buckets = new Map(); // key -> { count, resetAt }

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.socket && req.socket.remoteAddress || "unknown";
}

function rateLimit(opts) {
  const windowMs = opts.windowMs;
  const max = opts.max;
  const name = opts.name || "rl";
  return function (req, res, next) {
    const key = name + ":" + clientIp(req);
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) { b = { count: 0, resetAt: now + windowMs }; buckets.set(key, b); }
    b.count++;
    if (b.count > max) {
      const retry = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader("Retry-After", retry);
      return res.status(429).json({ error: "Too many requests. Please try again in " + retry + " seconds." });
    }
    next();
  };
}

// Dọn bucket cũ định kỳ để không rò rỉ bộ nhớ
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}, 5 * 60 * 1000).unref();

module.exports = { rateLimit, clientIp };
