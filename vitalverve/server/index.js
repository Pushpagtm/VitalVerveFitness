import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import { initializeDatabase, query } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const classes = [
  "Weight Training Classes",
  "Yoga Classes",
  "Ab Core Classes",
  "Adventure Classes",
  "Fitness Classes",
  "Training Classes",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
  })
);
app.use(express.json());

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authorization token missing." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

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
    const existingUserResult = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existingUserResult.rows[0]) {
      return res.status(409).json({ message: "User already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email.toLowerCase(), passwordHash]
    );
    const userId = insertResult.rows[0].id;

    const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      token,
      user: { id: userId, name, email: email.toLowerCase() },
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
    const userResult = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    const user = userResult.rows[0];
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

app.get("/api/classes", requireAuth, (_req, res) => {
  res.json({ classes });
});

app.get("/api/bookings", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, class_name, appointment_date, appointment_time, notes, created_at
       FROM bookings
       WHERE user_id = $1
       ORDER BY appointment_date ASC, appointment_time ASC`,
      [req.user.userId]
    );
    return res.json({ bookings: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Could not load bookings.", error: error.message });
  }
});

app.post("/api/bookings", requireAuth, async (req, res) => {
  const { className, appointmentDate, appointmentTime, notes = "" } = req.body;

  if (!className || !appointmentDate || !appointmentTime) {
    return res.status(400).json({
      message: "Class, appointment date and appointment time are required.",
    });
  }

  if (!classes.includes(className)) {
    return res.status(400).json({ message: "Selected class is invalid." });
  }

  try {
    const result = await query(
      `INSERT INTO bookings (user_id, class_name, appointment_date, appointment_time, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, class_name, appointment_date, appointment_time, notes, created_at`,
      [req.user.userId, className, appointmentDate, appointmentTime, notes]
    );
    return res.status(201).json({ booking: result.rows[0], message: "Appointment booked." });
  } catch (error) {
    return res.status(500).json({ message: "Booking failed.", error: error.message });
  }
});

app.delete("/api/bookings/:bookingId", requireAuth, async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: "Booking id is invalid." });
  }

  try {
    const result = await query(
      "DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING id",
      [bookingId, req.user.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Booking not found." });
    }

    return res.json({ message: "Booking cancelled successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Could not cancel booking.", error: error.message });
  }
});

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Auth API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize PostgreSQL:", error.message);
    process.exit(1);
  }
};

startServer();
