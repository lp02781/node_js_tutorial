
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, "../frontend");

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

const staticFiles = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/style.css": ["style.css", "text/css; charset=utf-8"]
};

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
    if (req.method === "GET" && staticFiles[path]) {
      const [filename, contentType] = staticFiles[path];
      const content = await readFile(join(frontendDir, filename));

      res.writeHead(200, { "Content-Type": contentType });
      return res.end(content);
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
