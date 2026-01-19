// =============================================================================
// PRISMA CLIENT - Shared Database Connection
// =============================================================================
// This creates a single PrismaClient instance to be shared across the app.
// Creating multiple instances can cause connection pool issues in production.
// =============================================================================

const { PrismaClient } = require('@prisma/client');

// Create a single instance
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection on startup
prisma.$connect()
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Database connection error:', err));

// Handle graceful shutdown signals (not beforeExit which can trigger unexpectedly)
process.on('SIGINT', async () => {
    console.log('SIGINT received, disconnecting...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, disconnecting...');
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = prisma;
