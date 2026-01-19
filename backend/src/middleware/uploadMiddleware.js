// =============================================================================
// UPLOAD MIDDLEWARE (Multer Configuration)
// =============================================================================
// Multer is a middleware for handling multipart/form-data (file uploads).
// This file configures how files are stored and validated.
//
// CONFIGURATION OPTIONS:
// - Storage: Where to save files (disk or memory)
// - File size limits: Prevent large files from crashing server
// - File type filtering: Only allow specific file types
// - Filename generation: Create unique names to prevent overwrites
// =============================================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================
// Disk storage saves files to the filesystem.
// We configure the destination folder and filename format.
// =============================================================================
const storage = multer.diskStorage({
    // Where to save the file
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },

    // What to name the file
    // Format: timestamp-randomstring-originalname
    // This prevents filename conflicts if same file is uploaded twice
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${uniqueSuffix}-${name}${ext}`);
    }
});

// =============================================================================
// FILE FILTER
// =============================================================================
// Controls which files are accepted for upload.
// We whitelist specific MIME types for security.
// 
// SECURITY NOTE: Always validate file types on the server!
// Client-side validation can be bypassed by attackers.
// =============================================================================
const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Spreadsheets  
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
};

// =============================================================================
// CREATE MULTER INSTANCE
// =============================================================================
// Configure multer with all our settings.
// limits.fileSize is in bytes (10MB = 10 * 1024 * 1024)
// =============================================================================
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        files: 5 // Maximum 5 files per request
    }
});

// =============================================================================
// EXPORT CONFIGURED UPLOAD MIDDLEWARE
// =============================================================================
// Usage in routes:
// - upload.single('file') - for single file upload
// - upload.array('files', 5) - for multiple files (max 5)
// - upload.fields([...]) - for multiple fields with files
// =============================================================================
module.exports = upload;
