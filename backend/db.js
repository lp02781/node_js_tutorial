import pg from "pg";

export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Create the tasks table automatically
export async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL
    )
  `);
}
