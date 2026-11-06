// Shared JSON Schemas. Registered with app.addSchema() and referenced as { $ref: "Task#" }.
// They show up in Swagger UI under "Schemas".

export const taskSchema = {
  $id: "Task",
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    title: { type: "string", example: "Learn Node.js" }
  }
};

export const errorSchema = {
  $id: "Error",
  type: "object",
  properties: {
    error: { type: "string", example: "Invalid ID" }
  }
};
