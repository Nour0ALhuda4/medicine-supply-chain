const express = require("express");
const bcryptjs = require("bcryptjs");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const port = 3000;

// JWT secret key (ideally from an env variable)
const jwtSecret = "yourSecretKey";

// Allow all origins with credentials
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"))

// PostgreSQL connection pool setup
const pool = new Pool({
  user: "postgres",
  password: "2004",
  host: "localhost",
  port: "5433",
  database: "world",
});

// Middleware to verify JWT from cookies
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).send("Access denied. No token provided.");

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).send("Invalid token.");
    req.user = user;
    next();
  });
}

// Home route (public)
app.get("/", (req, res) => {
  res.send("Welcome to the Express App!");
});

// Register a new user
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const findUserQuery = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(findUserQuery, [username]);

    if (result.rows.length > 0) {
      return res.status(400).send("Username already exists!");
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert new user into the database
    const insertUserQuery =
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *";
    await pool.query(insertUserQuery, [username, hashedPassword]);

    res.status(201).send("Registered successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

// User login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists by username
    const findUserQuery = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(findUserQuery, [username]);

    if (result.rows.length === 0) {
      return res.status(400).send("Wrong username or password!");
    }

    const findUser = result.rows[0];

    // Compare the hashed password
    const passwordMatch = await bcryptjs.compare(password, findUser.password);
    if (passwordMatch) {
      // Create a JWT token with a payload
      const token = jwt.sign(
        { id: findUser.id, username: findUser.username },
        jwtSecret,
        { expiresIn: "1d" }
      );

      // Set the token in an HTTP-only cookie
      res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
      return res.status(200).send(`Logged in successfully! Welcome, ${findUser.username}`);
    } else {
      return res.status(400).send("Wrong username or password!");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: err.message });
  }
});

// Protected route to fetch the current user info
app.get("/whoami", authenticateToken, (req, res) => {
  res.json({ username: req.user.username });
});

// Protected route to get the list of users
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Logout endpoint clears the token cookie
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.send("Logged out successfully!");
});

// Protected route example (optional)
app.get("/protected", authenticateToken, (req, res) => {
  res.send(`This is a protected route. Hello, ${req.user.username}!`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is started on port ${port}`);
});
