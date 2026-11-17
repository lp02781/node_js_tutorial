
// Import built-in Node.js modules and the PostgreSQL library
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

// Port where the backend server listens
const PORT = 3000;

// Find the folder of this file, then find the frontend folder
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, "../frontend");

// Create a connection pool to the database
// The database address comes from the DATABASE_URL environment variable
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Create the tasks table automatically
// "IF NOT EXISTS" means it will not fail if the table is already there
await db.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
  )
`);

// Send a JSON response with a status code
function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

// Read the request body and turn it into a JSON object
// Limit incoming request size to stop very large requests
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

// List of frontend files the server can send
// Each URL path points to a file name and its content type
const staticFiles = {
  "/": [
    "index.html",
    "text/html; charset=utf-8"
  ],
  "/app.js": [
    "app.js",
    "text/javascript; charset=utf-8"
  ],
  "/style.css": [
    "style.css",
    "text/css; charset=utf-8"
  ],
  "/docs": [
    "docs.html",
    "text/html; charset=utf-8"
  ],
  "/openapi.json": [
    "openapi.json",
    "application/json; charset=utf-8"
  ]
};

// Create the HTTP server
// This function runs for every request that comes in
const server = http.createServer(async (req, res) => {
  try {
    // Get only the path part of the URL (without query string)
    const path = new URL(req.url, "http://localhost").pathname;

    // GET /api/tasks
    // Return all tasks, newest first
    if (req.method === "GET" && path === "/api/tasks") {
      const result = await db.query(
        "SELECT * FROM tasks ORDER BY id DESC"
      );
      return sendJSON(res, 200, result.rows);
    }

    // POST /api/tasks
    // Add a new task to the database
    if (req.method === "POST" && path === "/api/tasks") {
      // Read the request body; reply with an error if it is not valid JSON
      let data;
      try {
        data = await readJSON(req);
      } catch {
        return sendJSON(res, 400, { error: "Invalid JSON" });
      }

      // Check that the title is a non-empty string of 200 characters or less
      if (typeof data.title !== "string" || !data.title.trim() || data.title.length > 200 )
      {
        return sendJSON(res, 400, {
          error: "Title must be 1-200 characters"
        });
      }

      // Save the task and get the new row back
      // $1 is a placeholder to keep the query safe from SQL injection
      const result = await db.query(
        "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
        [data.title.trim()]
      );

      // Reply with 201 Created and the new task
      return sendJSON(res, 201, result.rows[0]);
    }

    // DELETE /api/tasks/:id
    // Check if the path looks like /api/tasks/<number>
    const match = path.match(/^\/api\/tasks\/(\d+)$/);

    if (req.method === "DELETE" && match) {
      // Turn the ID from text into a number
      const id = Number(match[1]);

      // Make sure the ID is a valid positive number
      if (!Number.isSafeInteger(id) || id <= 0) {
        return sendJSON(res, 400, { error: "Invalid ID" });
      }

      // Delete the task and reply with 204 No Content
      await db.query("DELETE FROM tasks WHERE id = $1", [id]);
      res.writeHead(204);
      return res.end();
    }

    // Serve frontend
    // If the path is in the static file list, read the file and send it
    if (req.method === "GET" && staticFiles[path]) {
      const [filename, contentType] = staticFiles[path];
      const content = await readFile(join(frontendDir, filename));

      res.writeHead(200, { "Content-Type": contentType });
      return res.end(content);
    }

    // No route matched, so reply with 404 Not Found
    sendJSON(res, 404, { error: "Not found" });
  } catch (error) {
    // Something went wrong; log it and reply with 500
    console.error(error);
    sendJSON(res, 500, { error: "Internal server error" });
  }
});

// Start the server on all network interfaces
// "0.0.0.0" lets Docker reach the server from outside the container
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on port ${PORT}`);
});
