import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const NotebookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Untitled notebook" },
    files: { type: [FileSchema], default: [] },
    openFileIds: { type: [String], default: [] },
    activeFileId: { type: String, default: null },
  },
  { timestamps: true }
);

NotebookSchema.index({ updatedAt: -1 });

export const Notebook = mongoose.model("Notebook", NotebookSchema);
