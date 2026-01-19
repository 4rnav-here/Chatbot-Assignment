// =============================================================================
// FILE CONTROLLER
// =============================================================================
// Handles file upload functionality for projects.
// Uses multer middleware for handling multipart form data.
//
// FILE STORAGE STRATEGY:
// - Files are stored on disk in the /uploads folder
// - Metadata (filename, path, size) is stored in the database
// - Files are organized by project ID for easy management
//
// SECURITY CONSIDERATIONS:
// - File type validation (only allow safe types)
// - File size limits (prevent DoS attacks)
// - Unique filenames (prevent overwrites)
// =============================================================================

// Import shared Prisma client
const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs').promises;


// =============================================================================
// GET PROJECT FILES
// =============================================================================
// Endpoint: GET /api/files/:projectId
// Returns list of files uploaded to a project.
// =============================================================================
const getFiles = async (req, res, next) => {
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

        // Get files for this project
        const files = await prisma.file.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { files }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// UPLOAD FILE
// =============================================================================
// Endpoint: POST /api/files/:projectId
// Body: FormData with 'file' field
//
// The file upload is handled by multer middleware before this runs.
// req.file contains the uploaded file information.
// =============================================================================
const uploadFile = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: req.user.id
            }
        });

        if (!project) {
            // Delete the uploaded file since project doesn't exist
            await fs.unlink(req.file.path).catch(() => { });

            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have access'
            });
        }

        // Create file record in database
        const file = await prisma.file.create({
            data: {
                filename: req.file.originalname,
                storedName: req.file.filename,
                path: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size,
                projectId
            }
        });

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: { file }
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => { });
        }
        next(error);
    }
};

// =============================================================================
// DELETE FILE
// =============================================================================
// Endpoint: DELETE /api/files/:projectId/:fileId
//
// Deletes a file from both disk and database.
// =============================================================================
const deleteFile = async (req, res, next) => {
    try {
        const { projectId, fileId } = req.params;

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

        // Find the file
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                projectId
            }
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete file from disk
        await fs.unlink(file.path).catch((err) => {
            console.warn('Could not delete file from disk:', err.message);
        });

        // Delete file record from database
        await prisma.file.delete({
            where: { id: fileId }
        });

        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// DOWNLOAD FILE
// =============================================================================
// Endpoint: GET /api/files/:projectId/:fileId/download
//
// Sends the file for download with proper headers.
// =============================================================================
const downloadFile = async (req, res, next) => {
    try {
        const { projectId, fileId } = req.params;

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

        // Find the file
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                projectId
            }
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Send file for download
        res.download(file.path, file.filename);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFiles,
    uploadFile,
    deleteFile,
    downloadFile
};
