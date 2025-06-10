const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Create Quiz (admin only)
// POST /api/quiz/create
router.post("/create", verifyAdmin, async (req, res) => {
  try {
    const { title, questions, timeLimit } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Invalid quiz data" });
    }

    const quiz = new Quiz({
      title,
      questions,
      timeLimit,
      createdBy: req.user.id
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    console.error("Create Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Get all active quizzes
// GET /api/quiz/all
router.get("/all", verifyToken, async (req, res) => {
  try {
    // Find all quizzes
    const quizzes = await Quiz.find({}).sort({ createdAt: -1 });
    
    // Find all quiz attempts by the current user
    const attempts = await QuizResult.find({ user: req.user.id }).select('quiz terminated');
    const attemptedQuizIds = new Set(attempts.map(attempt => attempt.quiz.toString()));
    
    // Get terminated quizzes
    const terminatedQuizIds = new Set(
      attempts
        .filter(attempt => attempt.terminated)
        .map(attempt => attempt.quiz.toString())
    );
    
    // Get user's terminated quizzes from User model as well (for backward compatibility)
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user && user.terminatedQuizzes && user.terminatedQuizzes.length > 0) {
      user.terminatedQuizzes.forEach(quizId => terminatedQuizIds.add(quizId.toString()));
    }
    
    // Add attempted status to each quiz and filter out terminated quizzes
    const quizzesWithStatus = quizzes
      .filter(quiz => !terminatedQuizIds.has(quiz._id.toString())) // Filter out terminated quizzes
      .map(quiz => ({
        ...quiz.toObject(),
        attempted: attemptedQuizIds.has(quiz._id.toString())
      }));
    
    res.json(quizzesWithStatus);
  } catch (error) {
    console.error("Get Quizzes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all quizzes that the current user has attempted
// GET /api/quiz/attempted
router.get("/attempted", verifyToken, async (req, res) => {
  try {
    // Find all quiz attempts by the current user
    const results = await QuizResult.find({ user: req.user.id })
      .populate('quiz', 'title questions') // Populate quiz details
      .sort({ completedAt: -1 });
      
    // Get user's terminated quizzes from User model (for backward compatibility)
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const userTerminatedQuizIds = new Set();
    
    if (user && user.terminatedQuizzes && user.terminatedQuizzes.length > 0) {
      user.terminatedQuizzes.forEach(quizId => userTerminatedQuizIds.add(quizId.toString()));
    }
    
    // Format the response
    const attemptedQuizzes = results
      .filter(result => result.quiz) // Only include results with valid quizzes
      .map(result => {
        // Check if quiz is terminated either in QuizResult or User model
        const isTerminated = result.terminated || 
                           userTerminatedQuizIds.has(result.quiz._id.toString());
        
        return {
          quiz: result.quiz,
          score: result.score,
          completedAt: result.completedAt,
          terminated: isTerminated
        };
      });
      
    res.json(attemptedQuizzes);
  } catch (error) {
    console.error("Get Attempted Quizzes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get quiz by ID
// GET /api/quiz/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json(quiz);
  } catch (error) {
    console.error("Get Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete quiz (admin only)
// DELETE /api/quiz/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Delete Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update quiz (admin only)
// PUT /api/quiz/:id
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const { title, questions, timeLimit } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Invalid quiz data" });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, questions, timeLimit },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz updated successfully", quiz });
  } catch (error) {
    console.error("Update Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit quiz attempt
// POST /api/quiz/:id/submit
router.post("/:id/submit", verifyToken, async (req, res) => {
  try {
    const { answers, score } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quizResult = new QuizResult({
      user: req.user.id,
      quiz: quizId,
      answers,
      score,
    });

    await quizResult.save();
    res.status(201).json({ message: "Quiz submitted successfully", result: quizResult });
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark a quiz as terminated for the current user
// POST /api/quiz/terminate/:quizId
router.post('/terminate/:quizId', verifyToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add the quiz to user's terminated quizzes (for backward compatibility)
    if (!user.terminatedQuizzes) {
      user.terminatedQuizzes = [];
    }
    
    if (!user.terminatedQuizzes.includes(req.params.quizId)) {
      user.terminatedQuizzes.push(req.params.quizId);
      await user.save();
    }
    
    // Create or update a QuizResult entry with terminated status
    const existingResult = await QuizResult.findOne({ 
      user: req.user.id, 
      quiz: req.params.quizId 
    });
    
    if (existingResult) {
      // Update existing result
      existingResult.terminated = true;
      existingResult.terminatedAt = new Date();
      existingResult.terminatedBy = req.user.id; // Self-terminated
      await existingResult.save();
    } else {
      // Create new result with terminated status
      const quizResult = new QuizResult({
        user: req.user.id,
        quiz: req.params.quizId,
        answers: [],
        score: 0,
        terminated: true,
        terminatedAt: new Date(),
        terminatedBy: req.user.id // Self-terminated
      });
      await quizResult.save();
    }
    
    res.json({ message: 'Quiz terminated for user', userId: user._id });
  } catch (error) {
    console.error('Terminate Quiz Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// This is a duplicate route that can be removed
// The first /attempted route above handles this functionality now

// Leaderboard for a quiz
// GET /api/quiz/:quizId/leaderboard
router.get('/:quizId/leaderboard', verifyToken, async (req, res) => {
  try {
    const quizId = req.params.quizId;
    // Get all results for this quiz, populate user name/email
    const results = await QuizResult.find({ quiz: quizId })
      .populate('user', 'name email')
      .sort({ score: -1, completedAt: 1 });
    if (!results.length) {
      return res.json({ leaderboard: [], userRank: null });
    }
    // Build leaderboard array
    const leaderboard = results.map((result, idx) => ({
      name: result.user?.name || result.user?.email || 'User',
      email: result.user?.email || '',
      score: result.score,
      rank: idx + 1
    }));
    // Find current user's rank
    const userResultIdx = results.findIndex(r => r.user._id.toString() === req.user.id);
    let userRank = null;
    if (userResultIdx !== -1) {
      userRank = leaderboard[userResultIdx];
    }
    res.json({ leaderboard, userRank });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
