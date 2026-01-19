// =============================================================================
// EXPRESS SERVER - Main Entry Point
// =============================================================================
// This is where our backend application starts. It:
//   1. Loads environment variables from .env file
//   2. Sets up Express with middleware (CORS, JSON parsing)
//   3. Mounts all API routes
//   4. Starts listening for HTTP requests
//
// NOTES FOR UNDERSTANDING:
// - Express is a web framework that handles HTTP requests
// - Middleware are functions that process requests before they reach routes
// - CORS (Cross-Origin Resource Sharing) allows frontend to call our API
// =============================================================================

// Load environment variables FIRST (before any other imports that might use them)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Import error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

// =============================================================================
// CREATE EXPRESS APPLICATION
// =============================================================================
const app = express();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================
// Middleware runs in the order it's defined. Each request passes through
// these functions before reaching your route handlers.

// CORS - Allow requests from your frontend
// Without this, browsers would block requests from localhost:3000 to localhost:5000
app.use(cors({
  origin: true,  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Parse JSON request bodies
// When frontend sends JSON data, this middleware parses it into req.body
app.use(express.json());

// Parse URL-encoded form data (for regular HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
// This allows accessing uploaded files via URL: /uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================================================
// API ROUTES
// =============================================================================
// Routes are grouped by feature. Each route file handles related endpoints.
// The first argument is the base path, so:
// - authRoutes handles /api/auth/*
// - projectRoutes handles /api/projects/*

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint - useful for deployment monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================
// These MUST come after all routes. They catch errors that occur in routes.

// Handle 404 - Route not found
app.use(notFoundHandler);

// Handle all other errors
app.use(errorHandler);

// =============================================================================
// START SERVER
// =============================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  CHATBOT PLATFORM API                     ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                 ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  API Base URL: http://localhost:${PORT}/api                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Export for testing purposes
module.exports = app;
