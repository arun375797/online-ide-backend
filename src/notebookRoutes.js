import { Router } from "express";
import { Notebook } from "./models.js";

export const notebookRouter = Router();

notebookRouter.get("/", async (_req, res) => {
  const rows = await Notebook.find().sort({ updatedAt: -1 }).lean();
  res.json(rows);
});

notebookRouter.post("/", async (req, res) => {
  const name = String(req.body?.name || "Untitled notebook").trim() || "Untitled notebook";
  const row = await Notebook.create({
    name,
    files: [],
    openFileIds: [],
    activeFileId: null,
  });
  res.status(201).json(row);
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
    { new: true, runValidators: true }
  );
  if (!row) return res.status(404).json({ error: "Notebook not found." });
  res.json(row);
});

notebookRouter.delete("/:id", async (req, res) => {
  const row = await Notebook.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ error: "Notebook not found." });
  res.json({ ok: true });
});
