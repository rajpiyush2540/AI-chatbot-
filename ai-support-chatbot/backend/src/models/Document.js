const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
  chunkCount: Number,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);