import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { authRouter } from "./authRoutes.js";
import { notebookRouter } from "./notebookRoutes.js";
import { requireAuth } from "./middleware.js";

const PORT = Number(process.env.PORT) || 5000;

function allowedOrigins() {
  const extra = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://myide.cc",
    "https://www.myide.cc",
    ...extra,
  ];
}

async function connectDb() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production");
  }
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const memory = await MongoMemoryServer.create();
  await mongoose.connect(memory.getUri());
  console.log("MongoDB memory server connected (local only)");
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins().includes(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/notebooks", requireAuth, notebookRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error." });
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MyIDE API listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
