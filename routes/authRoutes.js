const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../middleware/validators');

/**
 * Public routes
 */

// Register new user
router.post('/register', registerValidator, register);

// Login user
router.post('/login', loginValidator, login);

/**
 * Protected routes
 */

// Get current user profile
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
