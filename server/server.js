require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());

// Configure CORS to allow all origins in development
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: function (origin, callback) {
        const allowedOrigins = [
          'https://quiz-application-main-4qxj.vercel.app',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'https://quiz-application-main-5njxup0m1-mayank7ns-projects.vercel.app',
          'https://quiz-application-main-alpha.vercel.app',
          /^https?:\/\/localhost(:[0-9]+)?$/,  // Match any localhost with any port
          /^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/ // Match any 127.0.0.1 with any port
        ];
        
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Check if the origin is allowed
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return allowed === origin;
          } else if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn('CORS: Blocked request from origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
  : {
      // In development, allow all origins for easier testing
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    };

app.use(cors(corsOptions));
app.options('*', cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes")); 
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api", require("./routes/statsRoutes"));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
} else {
  app.get("/", (req, res) => {
    res.send({
      activeStatus: true,
      message: "Server is running in development mode"
    });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));