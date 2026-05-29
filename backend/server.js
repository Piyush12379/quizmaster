/**
 * QuizMaster — Backend API
 * Express + Mongoose server with auto-seed for aptitude questions.
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/quizmaster";

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Mongoose Schema ──────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },      // e.g. "C++", "Data Structures"
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    question: { type: String, required: true },
    options: { type: [String], required: true },     // Array of 4 choices
    correctIndex: { type: Number, required: true },  // 0-based index of correct option
    explanation: { type: String, default: "" },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: false },
    email: { type: String, required: false },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_QUESTIONS = [
  {
    category: "C++ Basics",
    difficulty: "Easy",
    question:
      "Which of the following is the correct syntax to declare a pointer to an integer in C++?",
    options: ["int ptr;", "int *ptr;", "ptr int;", "*int ptr;"],
    correctIndex: 1,
    explanation:
      "In C++, a pointer is declared using the asterisk (*) before the variable name: `int *ptr;` declares ptr as a pointer to an integer.",
  },
  {
    category: "Data Structures",
    difficulty: "Medium",
    question:
      "What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    correctIndex: 2,
    explanation:
      "A balanced BST halves the search space at each step, giving O(log n) time complexity — similar to binary search on a sorted array.",
  },
  {
    category: "Linked Lists",
    difficulty: "Medium",
    question:
      "In a singly linked list, which operation has O(1) time complexity?",
    options: [
      "Searching for a node",
      "Deleting a node from the middle",
      "Inserting a node at the head",
      "Traversing the entire list",
    ],
    correctIndex: 2,
    explanation:
      "Inserting at the head only requires updating one pointer (new_node.next = head; head = new_node), making it O(1).",
  },
  {
    category: "General Logic",
    difficulty: "Easy",
    question:
      "A train travels 60 km in 1 hour. How long will it take to travel 210 km at the same speed?",
    options: ["2.5 hours", "3 hours", "3.5 hours", "4 hours"],
    correctIndex: 2,
    explanation:
      "Speed = 60 km/h. Time = Distance / Speed = 210 / 60 = 3.5 hours.",
  },
  {
    category: "C++ OOP",
    difficulty: "Hard",
    question:
      "What is the output of the following C++ code snippet?\n\nclass Base {\npublic:\n  virtual void show() { cout << \"Base\"; }\n};\nclass Derived : public Base {\npublic:\n  void show() { cout << \"Derived\"; }\n};\nint main() {\n  Base *b = new Derived();\n  b->show();\n}",
    options: ["Base", "Derived", "Compilation Error", "Runtime Error"],
    correctIndex: 1,
    explanation:
      "Because show() is declared `virtual` in Base, C++ uses dynamic dispatch. The Base pointer `b` points to a Derived object, so `Derived::show()` is called at runtime — this is polymorphism.",
  },
  {
    category: "Databases",
    difficulty: "Easy",
    question: "What does SQL stand for?",
    options: ["Structured Query Language", "Strong Question Language", "Structured Question Language", "System Query Language"],
    correctIndex: 0,
    explanation: "SQL stands for Structured Query Language, used for managing relational databases."
  },
  {
    category: "JavaScript",
    difficulty: "Medium",
    question: "Which keyword is used to declare a variable that cannot be reassigned?",
    options: ["var", "let", "const", "static"],
    correctIndex: 2,
    explanation: "The 'const' keyword creates a read-only reference to a value, meaning the variable identifier cannot be reassigned."
  },
  {
    category: "General Logic",
    difficulty: "Medium",
    question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
    options: ["Yes", "No", "Cannot be determined", "Only on Tuesdays"],
    correctIndex: 0,
    explanation: "This is a basic transitive logic puzzle. If A is B, and B is C, then A is C."
  },
  {
    category: "Networking",
    difficulty: "Hard",
    question: "Which OSI layer is responsible for routing packets between different networks?",
    options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"],
    correctIndex: 1,
    explanation: "The Network Layer (Layer 3) handles routing and forwarding of packets across multiple networks (e.g., using IP)."
  },
  {
    category: "Operating Systems",
    difficulty: "Medium",
    question: "What is a 'deadlock' in an operating system?",
    options: ["When the CPU overheats", "When two or more processes are waiting indefinitely for an event that can be caused by only one of the waiting processes", "When the hard drive runs out of memory", "When a process finishes execution instantly"],
    correctIndex: 1,
    explanation: "A deadlock is a specific condition where processes are stuck waiting for resources held by each other, causing a standstill."
  }
];

// ─── DB Connection + Seed ─────────────────────────────────────────────────────
async function connectAndSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅  MongoDB connected:", MONGO_URI);

    const count = await Question.countDocuments();
    if (count < SEED_QUESTIONS.length) {
      await Question.deleteMany({});
      await Question.insertMany(SEED_QUESTIONS);
      console.log(`🌱  Database seeded with ${SEED_QUESTIONS.length} questions.`);
    } else {
      console.log(`ℹ️   Database already has ${count} questions — skipping seed.`);
    }
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** POST /api/register — register a new user */
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Missing fields" });
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: "Username already taken" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = username === "admin";
    const user = new User({ username, password: hashedPassword, fullName, email, isAdmin });
    await user.save();
    
    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/login — login user */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Missing fields" });
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });
    
    res.json({ success: true, message: "Login successful", username: user.username, fullName: user.fullName, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/health — liveness probe */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "QuizMaster API",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/** GET /api/questions — fetch 5 random questions (options only, no correctIndex) */
app.get("/api/questions", async (_req, res) => {
  try {
    const questions = await Question.aggregate([
      { $sample: { size: 5 } },
      { $project: { correctIndex: 0, __v: 0 } }
    ]);
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/submit — validate answers and return score */
app.post("/api/submit", async (req, res) => {
  try {
    /**
     * Expected body:
     * { answers: [ { questionId: "...", selectedIndex: 2 }, ... ] }
     */
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: "No answers provided." });
    }

    const ids = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: ids } }).lean();

    let score = 0;
    const results = answers.map((answer) => {
      const q = questions.find((q) => String(q._id) === answer.questionId);
      if (!q) return { questionId: answer.questionId, correct: false };
      const correct = q.correctIndex === answer.selectedIndex;
      if (correct) score++;
      return {
        questionId: answer.questionId,
        correct,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      };
    });

    res.json({
      success: true,
      score,
      total: answers.length,
      percentage: Math.round((score / answers.length) * 100),
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

/** GET /api/admin/questions — fetch all questions including answers */
app.get("/api/admin/questions", async (_req, res) => {
  try {
    const questions = await Question.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/admin/questions — create a new question */
app.post("/api/admin/questions", async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** PUT /api/admin/questions/:id — update a question */
app.put("/api/admin/questions/:id", async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** DELETE /api/admin/questions/:id — delete a question */
app.delete("/api/admin/questions/:id", async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Start ────────────────────────────────────────────────────────────────────
connectAndSeed().then(() => {
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀  QuizMaster API listening on http://0.0.0.0:${PORT}`);
    console.log(`📋  Endpoints:`);
    console.log(`    GET  /api/health`);
    console.log(`    GET  /api/questions`);
    console.log(`    POST /api/submit`);
  });
});
