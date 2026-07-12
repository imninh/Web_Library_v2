/* Token phiên ký HMAC-SHA256; dạng base64url(payload).base64url(signature) */
"use strict";
const crypto = require("crypto");
const env = require("../config/env");

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}
function sign(payloadStr) {
  return crypto.createHmac("sha256", env.AUTH_TOKEN_SECRET).update(payloadStr).digest();
}

function create(userId) {
  const exp = Date.now() + env.TOKEN_TTL_DAYS * 24 * 3600 * 1000;
  const payload = b64url(JSON.stringify({ sub: userId, exp }));
  const sig = b64url(sign(payload));
  return payload + "." + sig;
}

function verify(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = sign(payload);
  const gotSig = fromB64url(sig);
  if (gotSig.length !== expectedSig.length || !crypto.timingSafeEqual(gotSig, expectedSig)) return null;
  let data;
  try { data = JSON.parse(fromB64url(payload).toString("utf8")); } catch (e) { return null; }
  if (!data || !data.exp || Date.now() > data.exp) return null;
  return { sub: data.sub, exp: data.exp };
}

module.exports = { create, verify };
