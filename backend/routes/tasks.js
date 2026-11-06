import { Router } from "express";
import { db } from "../db.js";

// All routes here are mounted under /api/tasks (see server.js)
const router = Router();

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get("/", async (req, res) => {
  const result = await db.query("SELECT * FROM tasks ORDER BY id DESC");
  res.json(result.rows);
});

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: Learn Swagger UI
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req, res) => {
  // req.body is already parsed by express.json() in server.js
  const title = req.body?.title;

  if (typeof title !== "string" || !title.trim() || title.length > 200) {
    return res.status(400).json({ error: "Title must be 1-200 characters" });
  }

  const result = await db.query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
    [title.trim()]
  );
  res.status(201).json(result.rows[0]);
});

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Task deleted
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", async (req, res) => {
  // :id in the path becomes req.params.id
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  await db.query("DELETE FROM tasks WHERE id = $1", [id]);
  res.sendStatus(204);
});

export default router;
