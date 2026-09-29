const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const { askQuestion } = require("../services/rag.service");

router.post("/", async (req, res) => {
  try {
    const { sessionId, question } = req.body;
    if (!question) return res.status(400).json({ message: "Question is required" });

    console.log("Received question:", question);
    const { answer, sources } = await askQuestion(question);
    console.log("Answer generated:", answer);

    let chat = await Chat.findOne({ sessionId });
    if (!chat) chat = new Chat({ sessionId, messages: [] });

    chat.messages.push({ role: "user", content: question });
    chat.messages.push({ role: "assistant", content: answer, sources: sources.map((s) => JSON.stringify(s)) });
    await chat.save();

    res.json({ answer, sources });
  } catch (err) {
    console.error("CHAT ROUTE ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:sessionId", async (req, res) => {
  const chat = await Chat.findOne({ sessionId: req.params.sessionId });
  res.json(chat || { messages: [] });
});

module.exports = router;