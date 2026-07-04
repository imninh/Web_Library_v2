/* Global error handler + 404 (spec §9.2). Thông báo tiếng Việt, UTF-8. */
"use strict";

function notFound(req, res) {
  res.status(404).json({ error: "Resource not found." });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error("[Librumi] Server error:", err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
  res.status(status).json({ error: err.message || "Invalid request." });
}

module.exports = { notFound, errorHandler };
