const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Custom Error class for consistent error handling
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;           // distinguishes expected from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 * Should be used as the last middleware in Express app
 */
const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message    = err.message    || ERROR_MESSAGES.INTERNAL_ERROR;

  // ── JWT errors ────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    message    = ERROR_MESSAGES.INVALID_TOKEN;
    statusCode = STATUS_CODES.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    message    = 'Token has expired, please login again';
    statusCode = STATUS_CODES.UNAUTHORIZED;
  }

  // ── Mongoose CastError (bad ObjectId, etc.) ───────────
  if (err.name === 'CastError') {
    message    = `Invalid ${err.path}: ${err.value}`;
    statusCode = STATUS_CODES.BAD_REQUEST;
  }

  // ── Mongoose ValidationError ──────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    message    = messages.join('. ');
    statusCode = STATUS_CODES.BAD_REQUEST;
  }

  // ── Mongoose duplicate-key error (code 11000) ─────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    message    = `Duplicate value for field: ${field}`;
    statusCode = STATUS_CODES.CONFLICT;
  }

  // ── Multer file-upload errors ─────────────────────────
  if (err.name === 'MulterError') {
    message    = `File upload error: ${err.message}`;
    statusCode = STATUS_CODES.BAD_REQUEST;
  }

  // ── CORS error ────────────────────────────────────────
  if (err.message && err.message.includes('Not allowed by CORS')) {
    message    = 'Origin not allowed by CORS policy';
    statusCode = STATUS_CODES.FORBIDDEN;
  }

  // ── Logging ───────────────────────────────────────────
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    console.error('Error:', {
      message,
      statusCode,
      stack: err.stack,
    });
  } else if (!err.isOperational) {
    // In production only log unexpected (programming) errors
    console.error('UNEXPECTED ERROR:', err);
  }

  // ── Response ──────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message: isProd && !err.isOperational
      ? ERROR_MESSAGES.INTERNAL_ERROR   // hide internals from client
      : message,
    ...(!isProd && { stack: err.stack }),
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler — catches any routes that fall through
 */
const notFoundHandler = (req, res, _next) => {
  res.status(STATUS_CODES.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
