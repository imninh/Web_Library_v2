/* Đọc & validate biến môi trường (spec §2.3). */
"use strict";
const path = require("path");

// Đọc .env ở backend/ (nếu có) - không lỗi nếu thiếu.
try { require("dotenv").config({ path: path.join(__dirname, "..", ".env") }); } catch (_) {}

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const env = {
  NODE_ENV,
  isProd,
  PORT: parseInt(process.env.PORT, 10) || 4000,
  DB_ADAPTER: process.env.DB_ADAPTER || "sqlite",
  DATABASE_URL: process.env.DATABASE_URL || "",
  DATA_DIR: process.env.LIBRUMI_DATA_DIR || path.join(__dirname, ".."),
  AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET || (isProd ? "" : "dev-insecure-secret-change-me"),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "*").split(",").map(s => s.trim()).filter(Boolean),
  MAX_ACTIVE_LOANS: process.env.MAX_ACTIVE_LOANS != null ? parseInt(process.env.MAX_ACTIVE_LOANS, 10) : 5,
  TOKEN_TTL_DAYS: 7
};

if (isProd && !env.AUTH_TOKEN_SECRET) {
  throw new Error("AUTH_TOKEN_SECRET là bắt buộc ở production (spec §5, §10).");
}
if (env.DB_ADAPTER === "postgres" && !env.DATABASE_URL) {
  throw new Error("DATABASE_URL là bắt buộc khi DB_ADAPTER=postgres (Supabase).");
}

module.exports = env;
