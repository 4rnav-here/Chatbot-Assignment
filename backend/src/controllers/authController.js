// =============================================================================
// AUTHENTICATION CONTROLLER
// =============================================================================
// Controllers contain the business logic for handling requests.
// This controller handles:
//   - User registration (creating new accounts)
//   - User login (verifying credentials and issuing JWT tokens)
//   - Getting current user info
//
// SECURITY NOTES:
// - Passwords are NEVER stored as plain text - we use bcrypt to hash them
// - JWT tokens are used for authentication (stateless, no server sessions)
// - Tokens expire after a set time for security
// =============================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client - this is our database connection
const prisma = new PrismaClient();

// =============================================================================
// HELPER FUNCTION: Generate JWT Token
// =============================================================================
// JWT (JSON Web Token) contains user info encoded in a secure string.
// The token is signed with our secret key so we can verify it later.
//
// Token structure: header.payload.signature
// - Header: Algorithm used (HS256)
// - Payload: Our data (user id, email)
// - Signature: Proof that we created this token
// =============================================================================
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );
};

// =============================================================================
// REGISTER NEW USER
// =============================================================================
// Endpoint: POST /api/auth/register
// Body: { email, password, name }
//
// Flow:
// 1. Check if email already exists
// 2. Hash the password (convert "password123" to random-looking string)
// 3. Create user in database
// 4. Generate JWT token
// 5. Return user info and token
// =============================================================================
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and name'
            });
        }

        // Validate email format using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Hash password before storing
        // Salt rounds (12) = how many times to process the hash
        // Higher = more secure but slower. 12 is a good balance.
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user in database
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name.trim()
            },
            // Select only fields we want to return (exclude password!)
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });

        // Generate JWT token
        const token = generateToken(user);

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
};

// =============================================================================
// LOGIN USER
// =============================================================================
// Endpoint: POST /api/auth/login
// Body: { email, password }
//
// Flow:
// 1. Find user by email
// 2. Compare provided password with stored hash
// 3. If match, generate and return JWT token
// 4. If no match, return error (don't specify which field was wrong!)
// =============================================================================
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email (include password for comparison)
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Check if user exists
        // SECURITY: Don't tell them specifically that email doesn't exist!
        // This prevents attackers from discovering valid emails.
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password with hash
        // bcrypt.compare() hashes the input and compares with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Send success response (exclude password from user object)
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.createdAt
                },
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

// =============================================================================
// GET CURRENT USER
// =============================================================================
// Endpoint: GET /api/auth/me
// Headers: Authorization: Bearer <token>
//
// This endpoint requires authentication (handled by authMiddleware).
// The middleware adds the user info to req.user before this runs.
// =============================================================================
const getMe = async (req, res, next) => {
    try {
        // req.user is set by the auth middleware after verifying the token
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                // Include count of user's projects
                _count: {
                    select: { projects: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        next(error);
    }
};

// Export all controller functions
module.exports = {
    register,
    login,
    getMe
};
