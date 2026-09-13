/** Cross-platform, dependency-free static server for meeting presentations. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.env.PORT || 5173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".csv": "text/csv",
  ".zip": "application/zip",
};
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("Build not found. Run npm install followed by npm run build.");
  process.exit(1);
}
const server = http.createServer((req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!fs.existsSync(file)) {
      if (path.extname(file)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      file = path.join(root, "index.html");
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
  } catch {
    res.writeHead(400);
    res.end("Invalid request");
  }
});
server.on("error", (e) => {
  console.error(e.message);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Squarewise meeting website: http://localhost:${port}\nKeep this terminal open. Press Ctrl+C to stop.`,
  ),
);
