import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("Register request received:", req.body);
    const { email, password } = req.body;
    const username = email;

    // Check if user already exists
    console.log("Checking if user exists:", username);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("User already exists:", username);
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    console.log("Creating new user:", username);
    const user = new User({ username, password });
    await user.save();
    console.log("User created successfully:", user._id);
    // Generate token
    console.log("Generating JWT token for user:", user._id);
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("Token generated successfully");

    res.status(201).json({ token: token, user: user });
  } catch (error) {
    console.error("Registration error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    const { username, password } = req.body;

    // Find user
    console.log("Looking for user:", username);
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log("User found:", user._id);

    // Check password
    console.log("Comparing passwords");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password mismatch for user:", user._id);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log("Password match successful");

    // Generate token
    console.log("Generating JWT token for user:", user._id);
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("Token generated successfully");

    res.json({ token: token, user: user });
  } catch (error) {
    console.error("Login error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ message: error.message });
  }
});

router.post("/logout", auth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    console.log("Get current user request received");
    console.log("User from request:", req.user);
    res.json({ user: req.user });
  } catch (error) {
    console.error("Get current user error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: error.message });
  }
});

export default router;
