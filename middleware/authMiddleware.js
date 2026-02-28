const { verifyToken } = require('../utils/tokenUtils');
const { AppError, asyncHandler } = require('./errorHandler');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Middleware to verify JWT token
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AppError(ERROR_MESSAGES.TOKEN_REQUIRED, STATUS_CODES.UNAUTHORIZED);
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError(ERROR_MESSAGES.INVALID_TOKEN, STATUS_CODES.UNAUTHORIZED);
  }
});

module.exports = authenticate;
