const { AppError, asyncHandler } = require('./errorHandler');
const { ROLE_PERMISSIONS, STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');
const Student = require('../models/Student');

/**
 * Middleware to check user role
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
    }

    next();
  });
};

/**
 * Middleware to check if user has specific permission
 * @param {string} permission - Permission to check
 */
const checkPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
    }

    next();
  });
};

/**
 * Only Admin can create Faculty or Subject
 * Use on routes: POST /api/users (faculty creation), POST /api/subjects
 */
const adminOnly = authorize('Admin');

/**
 * Only Faculty (and Admin) can mark attendance and add marks
 * Use on routes: POST /api/attendance, POST /api/results
 */
const facultyOrAdmin = authorize('Faculty', 'Admin');

/**
 * Students can only view their own data.
 * Compares the :studentId param (Student document _id) against
 * the Student record linked to the authenticated user.
 *
 * Admins and Faculty bypass this check.
 */
const restrictToOwnData = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
  }

  // Admin and Faculty can access any student data
  if (req.user.role === 'Admin' || req.user.role === 'Faculty') {
    return next();
  }

  // Student must only access their own data
  const studentId = req.params.studentId || req.params.id;

  if (!studentId) {
    return next();
  }

  // Find the Student document linked to the authenticated user
  const student = await Student.findOne({ user: req.user.id });

  if (!student) {
    throw new AppError('Student profile not found', STATUS_CODES.NOT_FOUND);
  }

  if (student._id.toString() !== studentId) {
    throw new AppError(
      'Access forbidden - you can only view your own data',
      STATUS_CODES.FORBIDDEN
    );
  }

  next();
});

module.exports = {
  authorize,
  checkPermission,
  adminOnly,
  facultyOrAdmin,
  restrictToOwnData,
};
