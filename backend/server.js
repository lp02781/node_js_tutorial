import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { initDb } from "./db.js";
import { openapiSpec } from "./swagger.js";
import tasksRouter from "./routes/tasks.js";

const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, "../frontend");

await initDb();

const app = express();

// --- Middleware: runs for every request, in order ---
app.use(morgan("dev"));                       // request logging
app.use(express.json({ limit: "10kb" }));     // parse JSON body into req.body, reject >10 KB

// --- API routes ---
app.use("/api/tasks", tasksRouter);

// --- API docs, generated from the @openapi comments in routes/ ---
app.get("/openapi.json", (req, res) => res.json(openapiSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// --- Frontend: serves index.html, app.js, style.css with correct MIME types ---
app.use(express.static(frontendDir));

// --- 404 for anything not matched above ---
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- Central error handler (4 args = error middleware) ---
// Express 5 forwards errors thrown in async handlers here automatically.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request too large" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`API docs at http://localhost:${PORT}/docs`);
});
