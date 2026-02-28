const express = require('express');
const router = express.Router();
const {
  addMarks,
  addBulkMarks,
  updateMarks,
  getStudentResults,
  getResultsBySubject,
  deleteResult,
} = require('../controllers/resultController');
const authenticate = require('../middleware/authMiddleware');
const { facultyOrAdmin, adminOnly, restrictToOwnData } = require('../middleware/roleMiddleware');
const { addMarksValidator, updateMarksValidator, mongoIdParam } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

/**
 * Add marks (Faculty only, Admin can also)
 * POST /api/results
 */
router.post('/', facultyOrAdmin, addMarksValidator, addMarks);

/**
 * Add bulk marks (Faculty only, Admin can also)
 * POST /api/results/bulk
 */
router.post('/bulk', facultyOrAdmin, addBulkMarks);

/**
 * Get student results
 * Students can only view their own results
 * GET /api/results/student/:studentId
 */
router.get('/student/:studentId', restrictToOwnData, getStudentResults);

/**
 * Get results by subject (Faculty and Admin only)
 * GET /api/results/subject/:subjectId
 */
router.get('/subject/:subjectId', facultyOrAdmin, getResultsBySubject);

/**
 * Update marks (Faculty only, Admin can also)
 * PATCH /api/results/:id
 */
router.patch('/:id', facultyOrAdmin, updateMarksValidator, updateMarks);

/**
 * Delete result (Admin only)
 * DELETE /api/results/:id
 */
router.delete('/:id', adminOnly, mongoIdParam, deleteResult);

module.exports = router;
