require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'https://quiz-app-git-main-mayank7n.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes")); 
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api", require("./routes/statsRoutes"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    activeStatus: true,
    message: "Server is active and running"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// For Vercel serverless functions
module.exports = app;
