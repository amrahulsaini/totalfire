import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME,
  ...(process.env.DB_PORT ? { port: Number(process.env.DB_PORT) } : {}),
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Auto-migrate: add game_name (utf8mb4 for emojis/symbols) if it doesn't exist yet.
pool
  .query(
    `ALTER TABLE tournament_entries
     ADD COLUMN IF NOT EXISTS game_name VARCHAR(100)
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL`
  )
  .catch(() => {
    // Non-fatal — column may already exist or table not yet created.
  });

export default pool;
