import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import { getAsync, initializeDatabase, runAsync } from "./db.js";

dotenv.config();
initializeDatabase();

const app = express();
const PORT = process.env.API_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const existingUser = await getAsync("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await runAsync(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email.toLowerCase(), passwordHash]
    );

    const token = jwt.sign({ userId: result.lastID, email: email.toLowerCase() }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      token,
      user: { id: result.lastID, name, email: email.toLowerCase() },
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed.", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await getAsync("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
});

app.listen(PORT, () => {
  // Keep this log explicit so the user can confirm API startup quickly.
  console.log(`Auth API running on http://localhost:${PORT}`);
});
