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

console.log('=== SERVER STARTING ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

console.log('Core modules loaded');

// Import route handlers with error catching
let authRoutes, projectRoutes, chatRoutes, fileRoutes, errorHandler, notFoundHandler;
try {
  authRoutes = require('./routes/authRoutes');
  console.log('authRoutes loaded');
  projectRoutes = require('./routes/projectRoutes');
  console.log('projectRoutes loaded');
  chatRoutes = require('./routes/chatRoutes');
  console.log('chatRoutes loaded');
  fileRoutes = require('./routes/fileRoutes');
  console.log('fileRoutes loaded');

  // Import error handling middleware
  const errorMiddleware = require('./middleware/errorMiddleware');
  errorHandler = errorMiddleware.errorHandler;
  notFoundHandler = errorMiddleware.notFoundHandler;
  console.log('All routes and middleware loaded successfully');
} catch (err) {
  console.error('FATAL: Failed to load routes:', err);
  process.exit(1);
}

// =============================================================================
// CREATE EXPRESS APPLICATION
// =============================================================================
const app = express();

// Enable GZIP compression
app.use(compression());

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
// Railway checks the root path by default
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ChatBot Platform API', timestamp: new Date().toISOString() });
});

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
const HOST = '0.0.0.0';  // Required for Railway/Docker - bind to all interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server started successfully!`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Export for testing purposes
module.exports = app;

