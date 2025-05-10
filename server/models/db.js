const { Pool } = require("pg");
let pool;

console.log("Environment:", process.env.NODE_ENV);

// Check if we're in production (DigitalOcean)
if (process.env.DATABASE_URL) {
  // DigitalOcean deployment
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log("Using DATABASE_URL connection string");
} else {
  // Local development
  pool = new Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "2004",
    host: "localhost",
    port: process.env.DB_PORT || "5433",
    database: process.env.DB_NAME || "world",
  });
}

// Test the database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
    console.error("Connection failed");
  } else {
    console.log("Database connected successfully");
    if (!process.env.DATABASE_URL) {
      console.log("Connection details:", {
        host: "localhost",
        port: process.env.DB_PORT || "5433",
        database: process.env.DB_NAME || "world",
        user: process.env.DB_USER || "postgres",
      });
    }
  }
});

module.exports = pool;