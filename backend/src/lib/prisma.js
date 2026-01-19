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

// Handle graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = prisma;
