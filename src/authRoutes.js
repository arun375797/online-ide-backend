import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { PIN_HASH } from "./pinHash.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, async (req, res) => {
  const pin = String(req.body?.pin ?? "");
  const digest = process.env.PIN_HASH || PIN_HASH;
  if (!digest || !process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Server auth is not configured." });
  }
  if (!pin) {
    return res.status(400).json({ error: "Enter your PIN." });
  }
  const ok = await bcrypt.compare(pin, digest);
  if (!ok) {
    return res.status(401).json({ error: "Incorrect PIN." });
  }
  const token = jwt.sign({ sub: "owner" }, process.env.JWT_SECRET, { expiresIn: "4h" });
  res.json({
    token,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  });
});

authRouter.get("/me", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Sign in required." });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ error: "Session expired. Sign in again." });
  }
});
