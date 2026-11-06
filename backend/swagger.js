import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Builds the OpenAPI spec from the @openapi comments in the route files.
// Add a new route file + comment and it appears in /docs automatically.
export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Node.js Tutorial API",
      version: "1.0.0",
      description: "Express REST API with PostgreSQL"
    },
    servers: [{ url: "/", description: "Current server" }],
    components: {
      schemas: {
        Task: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Learn Node.js" }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Invalid ID" }
          }
        }
      }
    }
  },
  apis: [join(__dirname, "routes/*.js")]
});
