"use strict";
const env = require("../config/env");

function cors(req, res, next) {
  const origin = req.headers.origin;
  const allowAll = env.CORS_ORIGINS.length === 1 && env.CORS_ORIGINS[0] === "*";
  if (origin) {
    if (allowAll && !env.isProd) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (env.CORS_ORIGINS.indexOf(origin) >= 0) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
}

module.exports = cors;
