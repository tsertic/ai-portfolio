const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT = 3000;
const DOCS = path.join(__dirname, "docs");

const MIME = {
  ".html":  "text/html",
  ".css":   "text/css",
  ".js":    "application/javascript",
  ".json":  "application/json",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".webp":  "image/webp",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
};

http.createServer((req, res) => {
  // Strip query string
  let urlPath = req.url.split("?")[0];

  // Build file path
  let filePath = path.join(DOCS, urlPath);

  // Security: prevent path traversal outside docs/
  if (!filePath.startsWith(DOCS)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }

  // If directory → serve index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // No extension → try .html
  if (!path.extname(filePath)) {
    filePath = filePath + ".html";
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end(`<h2>404 — Not found</h2><p>${urlPath}</p><a href="/">← Home</a>`);
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n🌐 Server: http://localhost:${PORT}`);
  console.log(`   Portfolio: http://localhost:${PORT}/`);
  console.log(`   History:   http://localhost:${PORT}/history/\n`);
});
