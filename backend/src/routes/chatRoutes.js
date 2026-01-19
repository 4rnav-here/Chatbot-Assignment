// =============================================================================
// CHAT ROUTES
// =============================================================================
// Defines the API endpoints for chat functionality.
// These routes handle getting message history and sending new messages.
//
// ROUTE STRUCTURE:
// - GET    /api/chat/:projectId/messages - Get chat history
// - POST   /api/chat/:projectId          - Send message, get AI response
// - DELETE /api/chat/:projectId/messages - Clear chat history
// =============================================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getMessages,
    sendMessage,
    clearMessages
} = require('../controllers/chatController');

// Import authentication middleware
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all chat routes
router.use(authMiddleware);

// =============================================================================
// CHAT ROUTES
// =============================================================================

// Get message history for a project
// GET /api/chat/:projectId/messages
// Query: ?limit=50 (optional, default 50)
router.get('/:projectId/messages', getMessages);

// Send a message and get AI response
// POST /api/chat/:projectId
// Body: { message: "User's message" }
// Returns: { userMessage, assistantMessage }
router.post('/:projectId', sendMessage);

// Clear all messages for a project
// DELETE /api/chat/:projectId/messages
router.delete('/:projectId/messages', clearMessages);

module.exports = router;
