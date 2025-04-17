import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import User from "./models/User.js";
import Message from "./models/Message.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import ollamaRoutes from "./routes/ollama.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ollama", ollamaRoutes);

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
