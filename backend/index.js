import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Message } from "./models/Message.js";
import fetch from "node-fetch";

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://mongodb:27017/chatdb")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, prompt } = req.body;

    if (!sessionId || !prompt) {
      return res
        .status(400)
        .json({ error: "sessionId and prompt are required" });
    }

    // Get last 10 messages from the session
    const history = await Message.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Format history for the prompt
    const formattedHistory = history
      .reverse()
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    const fullPrompt = `${formattedHistory}\nUser: ${prompt}\nAssistant:`;

    // Save user message
    const userMessage = new Message({
      sessionId,
      role: "user",
      content: prompt,
    });
    await userMessage.save();

    // Call Ollama API
    const response = await fetch("http://ollama:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral",
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from Ollama");
    }

    const data = await response.json();
    const assistantResponse = data.response;

    // Save assistant message
    const assistantMessage = new Message({
      sessionId,
      role: "assistant",
      content: assistantResponse,
    });
    await assistantMessage.save();

    res.json({ response: assistantResponse });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Clear chat endpoint
app.post("/api/clear", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    await Message.deleteMany({ sessionId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
