const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmission,
  gradeSubmission,
  getStudentAssignments,
} = require('../controllers/assignmentController');
const authenticate = require('../middleware/authMiddleware');
const { facultyOrAdmin, authorize } = require('../middleware/roleMiddleware');
const { upload, setUploadType } = require('../middleware/uploadMiddleware');
const { createAssignmentValidator, gradeSubmissionValidator, mongoIdParam } = require('../middleware/validators');

router.use(authenticate);

// ── Student-specific (must be before /:id) ───
router.get(
  '/student/my-assignments',
  authorize('Student'),
  getStudentAssignments
);

// ── Faculty: create assignment with PDF upload ─
router.post(
  '/',
  facultyOrAdmin,
  setUploadType('assignment'),
  upload.single('file'),
  createAssignmentValidator,
  createAssignment
);

// ── List assignments (faculty sees own, admin sees all) ─
router.get('/', facultyOrAdmin, getAssignments);

// ── Single assignment ──
router.get('/:id', mongoIdParam, getAssignmentById);

// ── Delete assignment ──
router.delete('/:id', facultyOrAdmin, mongoIdParam, deleteAssignment);

// ── Student: submit file ──
router.post(
  '/:id/submit',
  authorize('Student'),
  setUploadType('submission'),
  upload.single('file'),
  submitAssignment
);

// ── Faculty: view submissions ──
router.get('/:id/submissions', facultyOrAdmin, getSubmissions);

// ── Student: view own submission ──
router.get('/:id/my-submission', authorize('Student'), getMySubmission);

// ── Faculty: grade a submission ──
router.patch(
  '/submissions/:submissionId/grade',
  facultyOrAdmin,
  gradeSubmissionValidator,
  gradeSubmission
);

module.exports = router;
