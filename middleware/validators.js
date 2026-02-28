/**
 * Input Validation Middleware
 * Uses express-validator to sanitise and validate incoming requests.
 */

const { body, param, validationResult } = require('express-validator');

// ───────────────────────────── Helper ─────────────────────────────

/**
 * Middleware that checks for validation errors produced by the chains
 * that ran before it. Returns 400 with an array of error messages.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// ───────────────────────── Reusable Atoms ─────────────────────────

const isMongoId = (field, location = 'param') => {
  const chain = location === 'param' ? param(field) : body(field);
  return chain.isMongoId().withMessage(`${field} must be a valid ID`);
};

const trimmedString = (field, label) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label || field} is required`)
    .isLength({ max: 500 })
    .withMessage(`${label || field} must be at most 500 characters`);

const optionalTrimmedString = (field, label) =>
  body(field)
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(`${label || field} must be at most 500 characters`);

// ─────────────────────────── Auth ─────────────────────────────────

const registerValidator = [
  trimmedString('name', 'Name'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['Admin', 'Faculty', 'Student'])
    .withMessage('Role must be Admin, Faculty, or Student'),
  optionalTrimmedString('department', 'Department'),
  validate,
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─────────────────────────── Student ──────────────────────────────

const createStudentValidator = [
  trimmedString('name', 'Name'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  trimmedString('department', 'Department'),
  trimmedString('enrollmentNumber', 'Enrollment number'),
  trimmedString('course', 'Course'),
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  optionalTrimmedString('guardianName', 'Guardian name'),
  optionalTrimmedString('guardianPhone', 'Guardian phone'),
  validate,
];

const updateStudentValidator = [
  isMongoId('id'),
  optionalTrimmedString('name', 'Name'),
  optionalTrimmedString('department', 'Department'),
  optionalTrimmedString('course', 'Course'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  optionalTrimmedString('guardianName', 'Guardian name'),
  optionalTrimmedString('guardianPhone', 'Guardian phone'),
  validate,
];

// ─────────────────────────── Faculty ──────────────────────────────

const createFacultyValidator = [
  trimmedString('name', 'Name'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  trimmedString('department', 'Department'),
  trimmedString('employeeId', 'Employee ID'),
  optionalTrimmedString('qualification', 'Qualification'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  validate,
];

const updateFacultyValidator = [
  isMongoId('id'),
  optionalTrimmedString('name', 'Name'),
  optionalTrimmedString('department', 'Department'),
  optionalTrimmedString('qualification', 'Qualification'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  validate,
];

// ─────────────────────────── Subject ──────────────────────────────

const createSubjectValidator = [
  trimmedString('subjectName', 'Subject name'),
  trimmedString('subjectCode', 'Subject code'),
  trimmedString('department', 'Department'),
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  body('assignedFaculty').optional().isMongoId().withMessage('assignedFaculty must be a valid ID'),
  body('credits').optional().isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  validate,
];

const updateSubjectValidator = [
  isMongoId('id'),
  optionalTrimmedString('subjectName', 'Subject name'),
  optionalTrimmedString('subjectCode', 'Subject code'),
  optionalTrimmedString('department', 'Department'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  body('assignedFaculty').optional().isMongoId().withMessage('assignedFaculty must be a valid ID'),
  body('credits').optional().isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  validate,
];

// ─────────────────────────── Results ──────────────────────────────

const addMarksValidator = [
  isMongoId('student', 'body'),
  isMongoId('subject', 'body'),
  body('internalMarks')
    .isFloat({ min: 0 })
    .withMessage('Internal marks must be a non-negative number'),
  body('externalMarks')
    .isFloat({ min: 0 })
    .withMessage('External marks must be a non-negative number'),
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  validate,
];

const updateMarksValidator = [
  isMongoId('id'),
  body('internalMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Internal marks must be a non-negative number'),
  body('externalMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('External marks must be a non-negative number'),
  validate,
];

// ─────────────────────── Attendance ───────────────────────────────

const markAttendanceValidator = [
  isMongoId('student', 'body'),
  isMongoId('subject', 'body'),
  body('date').isISO8601().withMessage('Date must be a valid ISO-8601 date'),
  body('status')
    .isIn(['Present', 'Absent'])
    .withMessage('Status must be Present or Absent'),
  validate,
];

const markBulkAttendanceValidator = [
  isMongoId('subject', 'body'),
  body('date').isISO8601().withMessage('Date must be a valid ISO-8601 date'),
  body('attendanceRecords')
    .isArray({ min: 1 })
    .withMessage('attendanceRecords must be a non-empty array'),
  body('attendanceRecords.*.student')
    .isMongoId()
    .withMessage('Each record must have a valid student ID'),
  body('attendanceRecords.*.status')
    .isIn(['Present', 'Absent'])
    .withMessage('Each status must be Present or Absent'),
  validate,
];

const updateAttendanceValidator = [
  isMongoId('id'),
  body('status')
    .isIn(['Present', 'Absent'])
    .withMessage('Status must be Present or Absent'),
  validate,
];

// ──────────────────────── Notifications ───────────────────────────

const createNotificationValidator = [
  trimmedString('title', 'Title'),
  trimmedString('message', 'Message'),
  validate,
];

const createFacultyNotificationValidator = [
  trimmedString('title', 'Title'),
  trimmedString('message', 'Message'),
  isMongoId('subjectId', 'body'),
  validate,
];

// ──────────────────────── Assignments ─────────────────────────────

const createAssignmentValidator = [
  trimmedString('title', 'Title'),
  optionalTrimmedString('description', 'Description'),
  isMongoId('subject', 'body'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid ISO-8601 date'),
  body('totalMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total marks must be a non-negative integer'),
  validate,
];

const gradeSubmissionValidator = [
  isMongoId('submissionId'),
  body('marks')
    .isFloat({ min: 0 })
    .withMessage('Marks must be a non-negative number'),
  optionalTrimmedString('feedback', 'Feedback'),
  validate,
];

// ───────────────────── Shared Param Validator ─────────────────────

const mongoIdParam = [isMongoId('id'), validate];

module.exports = {
  validate,
  mongoIdParam,
  registerValidator,
  loginValidator,
  createStudentValidator,
  updateStudentValidator,
  createFacultyValidator,
  updateFacultyValidator,
  createSubjectValidator,
  updateSubjectValidator,
  addMarksValidator,
  updateMarksValidator,
  markAttendanceValidator,
  markBulkAttendanceValidator,
  updateAttendanceValidator,
  createNotificationValidator,
  createFacultyNotificationValidator,
  createAssignmentValidator,
  gradeSubmissionValidator,
};
