/* Dev static server: xem preview frontend khi chưa bật backend */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 4173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon"
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  // Dev server không có backend: /api/* trả 404 để frontend chuyển sang chế độ preview (mock).
  if (urlPath.indexOf("/api/") === 0) {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end('{"error":"no backend in dev-server"}');
  }
  if (urlPath === "/") urlPath = "/index.html";
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // SPA fallback (trừ khi xin /api hoặc file tĩnh có đuôi)
      if (path.extname(urlPath)) { res.writeHead(404); return res.end("Not found"); }
      file = path.join(ROOT, "index.html");
    }
    fs.readFile(file, (e, buf) => {
      if (e) { res.writeHead(500); return res.end("Error"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  });
}).listen(PORT, () => console.log("Librumi preview: http://localhost:" + PORT));
