const express = require("express");
const multer = require("multer");
const router = express.Router();
const Document = require("../models/Document");
const { ingestDocument } = require("../services/ingestion.service");

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const doc = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      status: "processing",
    });

    const chunkCount = await ingestDocument(req.file.path, req.file.mimetype, doc._id.toString());

    doc.status = "ready";
    doc.chunkCount = chunkCount;
    await doc.save();

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  const docs = await Document.find().sort({ uploadedAt: -1 });
  res.json(docs);
});

module.exports = router;