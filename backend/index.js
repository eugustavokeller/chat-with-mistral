import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import User from "./models/User.js";
import Message from "./models/Message.js";

const app = express();
const port = process.env.PORT || 3001;

// MongoDB connection
mongoose
  .connect("mongodb://mongodb:27017/chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://mongodb:27017/chat" }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const user = new User({ username, password });
    await user.save();

    req.session.userId = user._id;
    res.json({ user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user._id;
    res.json({ user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ error: "Failed to check auth status" });
  }
});

// Message routes
app.get("/api/messages", requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.session.userId }).sort({
      timestamp: 1,
    });
    res.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/chat", requireAuth, async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
