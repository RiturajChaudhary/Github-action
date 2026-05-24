const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://mongo-service:27017/tododb";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Todo = mongoose.model("Todo", todoSchema);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Get all todos
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create todo
app.post("/api/todos", async (req, res) => {
  try {
    const todo = new Todo({ text: req.body.text });
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle todo
app.patch("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    todo.done = !todo.done;
    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(404).json({ error: "Todo not found" });
  }
});

// Delete todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(404).json({ error: "Todo not found" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
