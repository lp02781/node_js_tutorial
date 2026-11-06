import { db } from "../db.js";

// A Fastify plugin: registered in server.js with prefix "/api/tasks".
// "" below means exactly /api/tasks (no trailing slash).
//
// Each route's `schema` does three jobs at once:
//   1. validates the request (bad input -> 400 before the handler runs)
//   2. serializes the response fast, and drops fields not in the schema
//   3. generates the Swagger docs at /docs
export default async function tasksRoutes(app) {
  app.get("", {
    schema: {
      summary: "Get all tasks",
      tags: ["Tasks"],
      response: {
        200: { type: "array", items: { $ref: "Task#" } }
      }
    }
  }, async () => {
    const result = await db.query("SELECT * FROM tasks ORDER BY id DESC");
    return result.rows;  // returning a value sends it as JSON
  });

  app.post("", {
    schema: {
      summary: "Create a new task",
      tags: ["Tasks"],
      body: {
        type: "object",
        required: ["title"],
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            pattern: "\\S",  // must contain a non-space character
            example: "Learn Swagger UI"
          }
        }
      },
      response: {
        201: { $ref: "Task#" },
        400: { $ref: "Error#" }
      }
    }
  }, async (req, reply) => {
    // No manual checks needed: the schema already guaranteed a valid title
    const result = await db.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
      [req.body.title.trim()]
    );
    return reply.code(201).send(result.rows[0]);
  });

  app.delete("/:id", {
    schema: {
      summary: "Delete a task",
      tags: ["Tasks"],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", minimum: 1 }  // "5" is coerced to the number 5
        }
      },
      response: {
        204: { type: "null", description: "Task deleted" },
        400: { $ref: "Error#" }
      }
    }
  }, async (req, reply) => {
    await db.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    return reply.code(204).send();
  });
}
