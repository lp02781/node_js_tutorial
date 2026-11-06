import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { initDb } from "./db.js";
import { taskSchema, errorSchema } from "./schemas.js";
import tasksRoutes from "./routes/tasks.js";

const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, "../frontend");

await initDb();

const app = Fastify({
  logger: true,       // built-in request logging (pino)
  bodyLimit: 10000,   // reject bodies over 10 KB with 413
  ajv: {
    // "example" is an OpenAPI keyword (for Swagger UI), not JSON Schema;
    // tell the validator to accept it
    customOptions: { keywords: ["example"] }
  }
});

// --- 404 for anything not matched ---
// (handlers apply only to routes registered AFTER them, so set them first)
app.setNotFoundHandler((req, reply) => {
  reply.code(404).send({ error: "Not found" });
});

// --- Central error handler: validation errors, bad JSON, too large, crashes ---
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode ?? 500;

  if (status >= 500) {
    req.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }

  // e.g. "body/title must NOT have more than 200 characters"
  reply.code(status).send({ error: err.message });
});

// --- Shared schemas, usable as { $ref: "Task#" } in any route ---
app.addSchema(taskSchema);
app.addSchema(errorSchema);

// --- Swagger: must be registered BEFORE the routes it documents ---
await app.register(swagger, {
  openapi: {
    info: {
      title: "Node.js Tutorial API",
      version: "1.0.0",
      description: "Fastify REST API with PostgreSQL"
    },
    servers: [{ url: "/", description: "Current server" }]
  },
  // Name components after their $id ("Task") instead of "def-0"
  refResolver: {
    buildLocalReference: (json, baseUri, fragment, i) => json.$id || `def-${i}`
  }
});
await app.register(swaggerUi, { routePrefix: "/docs" });

// --- API routes ---
await app.register(tasksRoutes, { prefix: "/api/tasks" });

// Raw spec, generated from the route schemas
app.get("/openapi.json", { schema: { hide: true } }, () => app.swagger());

// --- Frontend: index.html, app.js, style.css ---
await app.register(fastifyStatic, { root: frontendDir });

await app.listen({ port: PORT, host: "0.0.0.0" });
