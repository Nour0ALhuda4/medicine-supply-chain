const { Pool } = require("pg");

console.log("DEVELOPMENT OR PRUD?", process.env.NODE_ENV);
// In development, we connect to localhost:5433
// In production (Docker), we connect to container name and default port 5432
const dbHost =
  process.env.NODE_ENV === "production"
    ? process.env.DB_HOST || "foodornt-db"
    : "localhost";

const dbPort =
  process.env.NODE_ENV === "production"
    ? process.env.DB_PORT || "5432"
    : process.env.DB_PORT || "5433";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "2004",
  host: dbHost,
  port: dbPort,
  database: process.env.DB_NAME || "world",
});

// Test the database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
    console.error("Connection details:", {
      host: dbHost,
      port: dbPort,
      database: process.env.DB_NAME || "world",
      user: process.env.DB_USER || "postgres",
    });
  } else {
    console.log("Database connected successfully");
    console.log("Connection details:", {
      host: dbHost,
      port: dbPort,
      database: process.env.DB_NAME || "world",
      user: process.env.DB_USER || "postgres",
    });
  }
});

module.exports = pool;
