import express from "express";
import Message from "../models/Message.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Save user message
    const userMessage = new Message({
      userId: req.session.userId,
      role: "user",
      content: message,
    });
    await userMessage.save();

    // Stream response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send request to Ollama
    const response = await fetch("http://ollama:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral",
        messages: [{ role: "user", content: message }],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Ollama API request failed");
    }

    let assistantMessage = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      try {
        const data = JSON.parse(chunk);
        assistantMessage += data.message.content;
        res.write(
          `data: ${JSON.stringify({ content: data.message.content })}\n\n`
        );
      } catch (error) {
        console.error("Error parsing chunk:", error);
      }
    }

    // Save assistant message
    const savedAssistantMessage = new Message({
      userId: req.session.userId,
      role: "assistant",
      content: assistantMessage,
    });
    await savedAssistantMessage.save();

    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

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
