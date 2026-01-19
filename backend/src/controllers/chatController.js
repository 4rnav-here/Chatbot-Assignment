// =============================================================================
// CHAT CONTROLLER
// =============================================================================
// Handles the chat functionality:
//   - Get message history for a project
//   - Send a message and get AI response from Gemini
//   - Clear chat history
//
// HOW IT WORKS:
// 1. User sends a message
// 2. We save it to the database
// 3. We fetch conversation history
// 4. We send history + system prompt to Gemini
// 5. We save and return the AI response
//
// This approach maintains context across the conversation.
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const geminiService = require('../services/geminiService');

const prisma = new PrismaClient();

// =============================================================================
// GET MESSAGE HISTORY
// =============================================================================
// Endpoint: GET /api/chat/:projectId/messages
// Query params: ?limit=50 (optional, default 50)
//
// Returns chat messages for a project, oldest first (for display).
// =============================================================================
const getMessages = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: req.user.id
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        // Get messages, oldest first for proper display order
        const messages = await prisma.message.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' },
            take: limit
        });

        res.json({
            success: true,
            data: { messages }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// SEND MESSAGE (CHAT)
// =============================================================================
// Endpoint: POST /api/chat/:projectId
// Body: { message: "User's message" }
//
// This is the main chat endpoint. Flow:
// 1. Validate input
// 2. Verify project ownership
// 3. Save user message to database
// 4. Get conversation history
// 5. Call Gemini API with history + system prompt
// 6. Save assistant response to database
// 7. Return the response
// =============================================================================
const sendMessage = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { message } = req.body;

        // Validate message
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Verify project ownership and get system prompt
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: req.user.id
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                role: 'user',
                content: message.trim(),
                projectId
            }
        });

        // Get conversation history (last 20 messages for context)
        // More messages = more context but slower and more expensive
        const history = await prisma.message.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' },
            take: 20
        });

        // Call Gemini API
        const aiResponse = await geminiService.generateResponse(
            project.systemPrompt,
            history
        );

        // Save assistant response
        const assistantMessage = await prisma.message.create({
            data: {
                role: 'assistant',
                content: aiResponse,
                projectId
            }
        });

        res.json({
            success: true,
            data: {
                userMessage,
                assistantMessage
            }
        });

    } catch (error) {
        // Handle Gemini-specific errors
        if (error.message.includes('GEMINI')) {
            return res.status(503).json({
                success: false,
                message: 'AI service temporarily unavailable. Please try again.'
            });
        }
        next(error);
    }
};

// =============================================================================
// CLEAR CHAT HISTORY
// =============================================================================
// Endpoint: DELETE /api/chat/:projectId/messages
//
// Deletes all messages for a project. Useful for starting fresh.
// =============================================================================
const clearMessages = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: req.user.id
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        // Delete all messages for this project
        const result = await prisma.message.deleteMany({
            where: { projectId }
        });

        res.json({
            success: true,
            message: `Cleared ${result.count} messages`
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMessages,
    sendMessage,
    clearMessages
};
