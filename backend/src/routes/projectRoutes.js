// =============================================================================
// PROJECT ROUTES
// =============================================================================
// Defines the API endpoints for project/agent management.
// All routes require authentication - users can only access their own projects.
//
// ROUTE STRUCTURE:
// - GET    /api/projects      - List all projects
// - POST   /api/projects      - Create new project
// - GET    /api/projects/:id  - Get single project
// - PUT    /api/projects/:id  - Update project
// - DELETE /api/projects/:id  - Delete project
// =============================================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// Import authentication middleware
const authMiddleware = require('../middleware/authMiddleware');

// =============================================================================
// APPLY AUTH MIDDLEWARE TO ALL ROUTES
// =============================================================================
// router.use() applies middleware to all routes defined after it.
// This means every route below requires a valid JWT token.
// =============================================================================
router.use(authMiddleware);

// =============================================================================
// PROJECT CRUD ROUTES
// =============================================================================

// List all projects for the authenticated user
// GET /api/projects
router.get('/', getProjects);

// Create a new project
// POST /api/projects
// Body: { name, description?, systemPrompt? }
router.post('/', createProject);

// Get a single project by ID
// GET /api/projects/:id
router.get('/:id', getProject);

// Update a project
// PUT /api/projects/:id
// Body: { name?, description?, systemPrompt? }
router.put('/:id', updateProject);

// Delete a project
// DELETE /api/projects/:id
router.delete('/:id', deleteProject);

module.exports = router;
