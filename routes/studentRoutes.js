const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsBySubject,
  getMyProfile,
} = require('../controllers/studentController');
const authenticate = require('../middleware/authMiddleware');
const { adminOnly, facultyOrAdmin, authorize } = require('../middleware/roleMiddleware');
const { createStudentValidator, updateStudentValidator, mongoIdParam } = require('../middleware/validators');

router.use(authenticate);

// Student can view own profile (must be before /:id)
router.get('/me/profile', authorize('Student', 'Admin'), getMyProfile);

// Faculty can view students by subject (must be before /:id)
router.get('/by-subject/:subjectId', facultyOrAdmin, getStudentsBySubject);

router.post('/', adminOnly, createStudentValidator, createStudent);
router.get('/', adminOnly, getAllStudents);
router.get('/:id', adminOnly, mongoIdParam, getStudentById);
router.patch('/:id', adminOnly, updateStudentValidator, updateStudent);
router.delete('/:id', adminOnly, mongoIdParam, deleteStudent);

module.exports = router;
