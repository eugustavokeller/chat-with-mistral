import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Message from "./models/Message.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import ollamaRoutes from "./routes/ollama.js";

const app = express();
const port = process.env.PORT || 3001;

// JWT Configuration
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-with-at-least-32-characters";
const JWT_EXPIRES_IN = "24h";

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

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    console.log("user", user);
    next();
  });
};

app.use("/api/auth", authRoutes);
app.use("/api/chat", authenticateToken, chatRoutes);
app.use("/api/ollama", ollamaRoutes);

// Message routes
app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id }).sort({
      timestamp: 1,
    });
    res.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
