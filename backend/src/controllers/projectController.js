// =============================================================================
// PROJECT CONTROLLER
// =============================================================================
// Handles CRUD operations for projects/agents.
// Each project belongs to a user and has:
//   - Name and description
//   - System prompt (defines AI behavior)
//   - Chat messages
//   - Uploaded files
//
// AUTHORIZATION NOTE:
// All these endpoints are protected - users can only access their own projects.
// We always filter by userId to ensure data isolation.
// =============================================================================

// Import shared Prisma client
const prisma = require('../lib/prisma');

// =============================================================================
// GET ALL PROJECTS
// =============================================================================
// Endpoint: GET /api/projects
// Returns all projects owned by the authenticated user.
// Includes message count and file count for dashboard display.
// =============================================================================
const getProjects = async (req, res, next) => {
    try {
        const projects = await prisma.project.findMany({
            // Only get projects owned by this user
            where: { userId: req.user.id },
            // Include counts for dashboard stats
            include: {
                _count: {
                    select: {
                        messages: true,
                        files: true
                    }
                }
            },
            // Most recent first
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { projects }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// GET SINGLE PROJECT
// =============================================================================
// Endpoint: GET /api/projects/:id
// Returns detailed info about a specific project.
// Verifies the project belongs to the requesting user.
// =============================================================================
const getProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findFirst({
            // Find by ID AND user ID (security check)
            where: {
                id,
                userId: req.user.id
            },
            include: {
                _count: {
                    select: {
                        messages: true,
                        files: true
                    }
                },
                // Include recent files
                files: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        res.json({
            success: true,
            data: { project }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// CREATE PROJECT
// =============================================================================
// Endpoint: POST /api/projects
// Body: { name, description?, systemPrompt? }
//
// Creates a new project/agent for the authenticated user.
// =============================================================================
const createProject = async (req, res, next) => {
    try {
        const { name, description, systemPrompt } = req.body;

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // Create the project
        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                systemPrompt: systemPrompt?.trim() || 'You are a helpful assistant.',
                userId: req.user.id
            }
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { project }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// UPDATE PROJECT
// =============================================================================
// Endpoint: PUT /api/projects/:id
// Body: { name?, description?, systemPrompt? }
//
// Updates an existing project. All fields are optional.
// =============================================================================
const updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, systemPrompt } = req.body;

        // First check if project exists and belongs to user
        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt.trim();

        // Update the project
        const project = await prisma.project.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: { project }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// DELETE PROJECT
// =============================================================================
// Endpoint: DELETE /api/projects/:id
//
// Deletes a project and all associated data (messages, files).
// The cascade delete is configured in the Prisma schema.
// =============================================================================
const deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        // First check if project exists and belongs to user
        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        // Delete the project (cascade will delete messages and files)
        await prisma.project.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
};
