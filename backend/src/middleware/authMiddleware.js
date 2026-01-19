// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
// This middleware protects routes that require authentication.
// It verifies the JWT token sent in the Authorization header.
//
// HOW IT WORKS:
// 1. Check if Authorization header exists
// 2. Extract the token (format: "Bearer <token>")
// 3. Verify the token using our secret key
// 4. If valid, attach user info to request and continue
// 5. If invalid, return 401 Unauthorized error
//
// USAGE:
// Apply to any route that requires authentication:
// router.get('/protected', authMiddleware, myController);
// =============================================================================

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;

        // Check if header exists and starts with "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Extract token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format.'
            });
        }

        // Verify the token
        // jwt.verify() throws an error if token is invalid or expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists in database
        // (user might have been deleted after token was issued)
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists.'
            });
        }

        // Attach user info to request object
        // Now all subsequent middleware and routes can access req.user
        req.user = user;

        // Continue to next middleware/route
        next();

    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        // For any other error, pass to error handler
        next(error);
    }
};

module.exports = authMiddleware;
