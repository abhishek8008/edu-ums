require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ── Validate critical env vars early ────────────────────────────
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of requiredVars) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (isProd && process.env.JWT_SECRET.includes('change_this')) {
  console.error(
    'FATAL: JWT_SECRET still has its placeholder value. Set a strong secret for production.'
  );
  process.exit(1);
}

/**
 * Start server and connect to database
 */
const startServer = async () => {
  try {
    // Connect to MongoDB (local or Atlas)
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║  University Management System API                        ║
║  Server running on port ${String(PORT).padEnd(5)}                           ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(14)}                       ║
║  Health check: /api/health                               ║
╚══════════════════════════════════════════════════════════╝
      `);
    });

    // ── Graceful shutdown helper ──────────────────────────
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully…`);
      server.close(async () => {
        try {
          await mongoose.connection.close(false);
          console.log('MongoDB connection closed.');
        } catch (err) {
          console.error('Error closing MongoDB:', err);
        }
        console.log('Server closed.');
        process.exit(0);
      });

      // Force exit if shutdown takes too long
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    // ── Process-level event handlers ──────────────────────
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      // In production, shut down; locally keep running for debugging
      if (isProd) gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
