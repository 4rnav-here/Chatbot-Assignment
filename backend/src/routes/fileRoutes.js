// =============================================================================
// FILE ROUTES
// =============================================================================
// Defines the API endpoints for file upload functionality.
// Files are associated with projects and stored on disk.
//
// ROUTE STRUCTURE:
// - GET    /api/files/:projectId              - List files in project
// - POST   /api/files/:projectId              - Upload file to project
// - GET    /api/files/:projectId/:fileId/download - Download file
// - DELETE /api/files/:projectId/:fileId      - Delete file
// =============================================================================

const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getFiles,
    uploadFile,
    deleteFile,
    downloadFile
} = require('../controllers/fileController');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Apply auth middleware to all file routes
router.use(authMiddleware);

// =============================================================================
// FILE ROUTES
// =============================================================================

// List all files for a project
// GET /api/files/:projectId
router.get('/:projectId', getFiles);

// Upload a file to a project
// POST /api/files/:projectId
// Body: FormData with 'file' field
// Note: upload.single('file') handles the file upload before our controller runs
router.post('/:projectId', upload.single('file'), uploadFile);

// Download a file
// GET /api/files/:projectId/:fileId/download
router.get('/:projectId/:fileId/download', downloadFile);

// Delete a file
// DELETE /api/files/:projectId/:fileId
router.delete('/:projectId/:fileId', deleteFile);

module.exports = router;
