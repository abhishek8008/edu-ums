const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    throw new AppError(
      'Name, email, and password are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(ERROR_MESSAGES.USER_EXISTS, STATUS_CODES.CONFLICT);
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Student',
    department,
  });

  // Generate JWT token using model method
  const token = user.generateToken();

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new AppError(
      'Email and password are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  // Find user and select password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      STATUS_CODES.UNAUTHORIZED
    );
  }

  // Compare passwords using model method
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      STATUS_CODES.UNAUTHORIZED
    );
  }

  // Generate JWT token using model method
  const token = user.generateToken();

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};
