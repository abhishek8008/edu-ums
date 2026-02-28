const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getAttendanceByStudent,
  getAttendanceBySubject,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const authenticate = require('../middleware/authMiddleware');
const { facultyOrAdmin, adminOnly, restrictToOwnData } = require('../middleware/roleMiddleware');
const { markAttendanceValidator, markBulkAttendanceValidator, updateAttendanceValidator, mongoIdParam } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

/**
 * Mark attendance (Faculty only, Admin can also)
 * POST /api/attendance
 */
router.post('/', facultyOrAdmin, markAttendanceValidator, markAttendance);

/**
 * Mark bulk attendance (Faculty only, Admin can also)
 * POST /api/attendance/bulk
 */
router.post('/bulk', facultyOrAdmin, markBulkAttendanceValidator, markBulkAttendance);

/**
 * Get attendance by student
 * Students can only view their own attendance
 * GET /api/attendance/student/:studentId
 */
router.get('/student/:studentId', restrictToOwnData, getAttendanceByStudent);

/**
 * Get attendance by subject (Faculty and Admin only)
 * GET /api/attendance/subject/:subjectId
 */
router.get('/subject/:subjectId', facultyOrAdmin, getAttendanceBySubject);

/**
 * Update attendance (Faculty only, Admin can also)
 * PATCH /api/attendance/:id
 */
router.patch('/:id', facultyOrAdmin, updateAttendanceValidator, updateAttendance);

/**
 * Delete attendance (Admin only)
 * DELETE /api/attendance/:id
 */
router.delete('/:id', adminOnly, mongoIdParam, deleteAttendance);

module.exports = router;
