const express = require('express');
const router = express.Router();
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const authenticate = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const { createSubjectValidator, updateSubjectValidator, mongoIdParam } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

/**
 * Create subject (Admin only)
 * POST /api/subjects
 */
router.post('/', adminOnly, createSubjectValidator, createSubject);

/**
 * Get all subjects (all authenticated users)
 * GET /api/subjects
 * Query params: department, semester
 */
router.get('/', getAllSubjects);

/**
 * Get subject by ID (all authenticated users)
 * GET /api/subjects/:id
 */
router.get('/:id', mongoIdParam, getSubjectById);

/**
 * Update subject (Admin only)
 * PATCH /api/subjects/:id
 */
router.patch('/:id', adminOnly, updateSubjectValidator, updateSubject);

/**
 * Delete subject (Admin only)
 * DELETE /api/subjects/:id
 */
router.delete('/:id', adminOnly, mongoIdParam, deleteSubject);

module.exports = router;
