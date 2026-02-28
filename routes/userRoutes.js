const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

/**
 * All routes in this file require authentication
 */
router.use(authenticate);

/**
 * Get all users (Admin only)
 */
router.get('/', authorize('Admin'), getAllUsers);

/**
 * Get user by ID
 * Students and Faculty can only view their own profile
 */
router.get('/:id', (req, res, next) => {
  // Allow users to view their own profile or admins to view anyone
  if (req.user.id !== req.params.id && req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden - you can only view your own profile',
    });
  }
  next();
}, getUserById);

/**
 * Update user
 * Users can update their own profile, admins can update any user
 */
router.patch('/:id', updateUser);

/**
 * Delete user (Admin only)
 */
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;
