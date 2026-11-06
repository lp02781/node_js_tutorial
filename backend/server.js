
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize, sep } from "node:path";
import pg from "pg";

const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, "../frontend/dist");  // React build output

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Create the tasks table automatically
await db.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
  )
`);

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

// Limit incoming request size
async function readJSON(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 10000) {
      throw new Error("Request too large");
    }
  }
  return JSON.parse(body);
}

// Vite puts hashed bundles in /assets, so serve any file in dist by extension
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

// Friendly URLs -> files
const aliases = {
  "/": "/index.html",
  "/docs": "/docs.html"
};

async function serveStatic(path, res) {
  const filePath = normalize(join(frontendDir, aliases[path] ?? path));

  // Block path traversal like /../backend/server.js
  if (!filePath.startsWith(frontendDir + sep)) return false;

  const contentType = mimeTypes[extname(filePath)];
  if (!contentType) return false;

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
    return true;
  } catch {
    return false;  // file not found -> fall through to 404
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;

    // GET /api/tasks
    if (req.method === "GET" && path === "/api/tasks") {
      const result = await db.query(
        "SELECT * FROM tasks ORDER BY id DESC"
      );
      return sendJSON(res, 200, result.rows);
    }

    // POST /api/tasks
    if (req.method === "POST" && path === "/api/tasks") {
      let data;
      try {
        data = await readJSON(req);
      } catch {
        return sendJSON(res, 400, { error: "Invalid JSON" });
      }

      if (typeof data.title !== "string" || !data.title.trim() || data.title.length > 200 ) 
      {
        return sendJSON(res, 400, {
          error: "Title must be 1-200 characters"
        });
      }

      const result = await db.query(
        "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
        [data.title.trim()]
      );

      return sendJSON(res, 201, result.rows[0]);
    }

    // DELETE /api/tasks/:id
    const match = path.match(/^\/api\/tasks\/(\d+)$/);

    if (req.method === "DELETE" && match) {
      const id = Number(match[1]);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return sendJSON(res, 400, { error: "Invalid ID" });
      }

      await db.query("DELETE FROM tasks WHERE id = $1", [id]);
      res.writeHead(204);
      return res.end();
    }

    // Serve frontend
    if (req.method === "GET" && await serveStatic(path, res)) {
      return;
    }

    sendJSON(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    sendJSON(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on port ${PORT}`);
});
