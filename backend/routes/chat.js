import express from "express";
import Message from "../models/Message.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get chat history by sessionId
router.get("/messages/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save message
router.post("/save", auth, async (req, res) => {
  try {
    const { sessionId, role, content } = req.body;
    const message = new Message({
      sessionId,
      role,
      content,
      timestamp: new Date(),
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear chat history
router.delete("/clear/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    await Message.deleteMany({ sessionId });
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
