const express = require('express');
const router = express.Router();
const {
  createFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  getMyProfile,
  getMySubjects,
} = require('../controllers/facultyController');
const authenticate = require('../middleware/authMiddleware');
const { adminOnly, facultyOrAdmin } = require('../middleware/roleMiddleware');
const { createFacultyValidator, updateFacultyValidator, mongoIdParam } = require('../middleware/validators');

router.use(authenticate);

// Faculty self-service routes (must be before /:id)
router.get('/me/profile', facultyOrAdmin, getMyProfile);
router.get('/me/subjects', facultyOrAdmin, getMySubjects);

router.post('/', adminOnly, createFacultyValidator, createFaculty);
router.get('/', adminOnly, getAllFaculty);
router.get('/:id', adminOnly, mongoIdParam, getFacultyById);
router.patch('/:id', adminOnly, updateFacultyValidator, updateFaculty);
router.delete('/:id', adminOnly, mongoIdParam, deleteFaculty);

module.exports = router;
