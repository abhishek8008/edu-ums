const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Get all users (Admin only)
 * GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    count: users.length,
    data: {
      users,
    },
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

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

/**
 * Update user (Admin and self)
 * PATCH /api/users/:id
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, department } = req.body;

  // Check if user is updating their own profile or is admin
  if (req.user.id !== id && req.user.role !== 'Admin') {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  // Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (department && req.user.role === 'Admin') updateData.department = department;

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user,
    },
  });
});

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
