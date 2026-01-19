// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================
// Defines the API endpoints for user authentication.
// These routes handle registration, login, and getting current user info.
//
// ROUTE STRUCTURE:
// - POST /api/auth/register - Create new account
// - POST /api/auth/login    - Login and get token
// - GET  /api/auth/me       - Get current user (requires auth)
//
// NOTES:
// - Express Router allows us to group related routes
// - We import controllers to handle the actual logic
// - authMiddleware protects routes that need authentication
// =============================================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const { register, login, getMe } = require('../controllers/authController');

// Import authentication middleware
const authMiddleware = require('../middleware/authMiddleware');

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

// Register a new user
// POST /api/auth/register
// Body: { email, password, name }
router.post('/register', register);

// Login with email and password
// POST /api/auth/login
// Body: { email, password }
// Returns: { user, token }
router.post('/login', login);

// =============================================================================
// PROTECTED ROUTES (Authentication required)
// =============================================================================

// Get current user info
// GET /api/auth/me
// Headers: Authorization: Bearer <token>
router.get('/me', authMiddleware, getMe);

module.exports = router;
