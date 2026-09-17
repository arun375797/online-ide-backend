import { Router } from "express";
import { Notebook } from "./models.js";

export const notebookRouter = Router();

function publicNotebook(row) {
  if (!row) return row;
  const doc = typeof row.toObject === "function" ? row.toObject() : row;
  return {
    ...doc,
    files: Array.isArray(doc.files) ? doc.files : [],
    openFileIds: Array.isArray(doc.openFileIds) ? doc.openFileIds : [],
    activeFileId: doc.activeFileId ?? null,
  };
}

notebookRouter.get("/", async (_req, res) => {
  const rows = await Notebook.find().sort({ updatedAt: -1 }).lean();
  res.json(rows.map(publicNotebook));
});

notebookRouter.get("/:id", async (req, res) => {
  try {
    const row = await Notebook.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ error: "Notebook not found." });
    res.json(publicNotebook(row));
  } catch {
    res.status(404).json({ error: "Notebook not found." });
  }
});

notebookRouter.post("/", async (req, res) => {
  const name = String(req.body?.name || "Untitled notebook").trim() || "Untitled notebook";
  const row = await Notebook.create({
    name,
    files: [],
    openFileIds: [],
    activeFileId: null,
  });
  res.status(201).json(publicNotebook(row));
});

notebookRouter.put("/:id", async (req, res) => {
  const { name, files, openFileIds, activeFileId } = req.body || {};
  const row = await Notebook.findByIdAndUpdate(
    req.params.id,
    {
      ...(typeof name === "string" ? { name } : {}),
      ...(Array.isArray(files) ? { files } : {}),
      ...(Array.isArray(openFileIds) ? { openFileIds } : {}),
      ...(activeFileId === null || typeof activeFileId === "string" ? { activeFileId } : {}),
    },
    { new: true, runValidators: true, lean: true }
  );
  if (!row) return res.status(404).json({ error: "Notebook not found." });
  res.json(publicNotebook(row));
});

notebookRouter.delete("/:id", async (req, res) => {
  const row = await Notebook.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ error: "Notebook not found." });
  res.json({ ok: true });
});
