// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================
// Centralized error handling for the entire application.
// Instead of handling errors in each route, we pass them to these middleware
// using next(error), and they format a consistent error response.
//
// BENEFITS:
// - Consistent error response format across all endpoints
// - Single place to add logging, monitoring, etc.
// - Cleaner route handlers (just call next(error))
// =============================================================================

// =============================================================================
// NOT FOUND HANDLER (404)
// =============================================================================
// This middleware catches requests to routes that don't exist.
// It must be placed AFTER all route definitions.
// =============================================================================
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        hint: 'Check the API documentation for available endpoints.'
    });
};

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================
// This middleware catches all errors thrown in routes.
// Express recognizes it as an error handler because it has 4 parameters.
//
// Types of errors handled:
// - Prisma errors (database constraints, unique violations)
// - Validation errors
// - Unexpected errors (logged but not exposed to client)
// =============================================================================
const errorHandler = (err, req, res, next) => {
    // Log error for debugging (in production, use a proper logger)
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Handle Prisma errors
    if (err.code) {
        switch (err.code) {
            // Unique constraint violation (e.g., duplicate email)
            case 'P2002':
                statusCode = 400;
                const field = err.meta?.target?.[0] || 'field';
                message = `A record with this ${field} already exists.`;
                break;

            // Foreign key constraint (e.g., referencing non-existent user)
            case 'P2003':
                statusCode = 400;
                message = 'Referenced record does not exist.';
                break;

            // Record not found
            case 'P2025':
                statusCode = 404;
                message = 'Record not found.';
                break;

            default:
                // For unknown Prisma errors, use generic message
                if (process.env.NODE_ENV !== 'development') {
                    message = 'Database operation failed.';
                }
        }
    }

    // Handle validation errors (from express-validator if used)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    }

    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Something went wrong. Please try again later.';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        // Include stack trace in development for debugging
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
