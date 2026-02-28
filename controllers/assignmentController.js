const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');

/**
 * Helper — resolve the Faculty _id from the authenticated user
 */
const resolveFacultyId = async (user) => {
  const faculty = await Faculty.findOne({ user: user.id });
  return faculty?._id || null;
};

/**
 * Create assignment (Faculty uploads PDF)
 * POST /api/assignments
 */
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, dueDate, totalMarks } = req.body;

  if (!title || !subject || !dueDate) {
    throw new AppError('title, subject, and dueDate are required', STATUS_CODES.BAD_REQUEST);
  }

  if (!req.file) {
    throw new AppError('Assignment file (PDF) is required', STATUS_CODES.BAD_REQUEST);
  }

  const facultyId = await resolveFacultyId(req.user);
  if (!facultyId) {
    throw new AppError('Faculty profile not found', STATUS_CODES.NOT_FOUND);
  }

  const assignment = await Assignment.create({
    title,
    description: description || '',
    subject,
    faculty: facultyId,
    filePath: req.file.path.replace(/\\/g, '/'),
    originalFileName: req.file.originalname,
    dueDate,
    totalMarks: totalMarks || 100,
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Assignment created successfully',
    data: { assignment },
  });
});

/**
 * Get assignments by subject  (faculty or student)
 * GET /api/assignments?subject=xxx
 */
const getAssignments = asyncHandler(async (req, res) => {
  const { subject } = req.query;

  const query = {};
  if (subject) query.subject = subject;

  // If Faculty, only show their own assignments
  if (req.user.role === 'Faculty') {
    const facultyId = await resolveFacultyId(req.user);
    if (facultyId) query.faculty = facultyId;
  }

  const assignments = await Assignment.find(query)
    .populate('subject', 'subjectName subjectCode')
    .populate({
      path: 'faculty',
      select: 'employeeId',
      populate: { path: 'user', select: 'name' },
    })
    .populate('submissionCount')
    .sort({ createdAt: -1 });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    count: assignments.length,
    data: { assignments },
  });
});

/**
 * Get single assignment
 * GET /api/assignments/:id
 */
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('subject', 'subjectName subjectCode')
    .populate({
      path: 'faculty',
      select: 'employeeId',
      populate: { path: 'user', select: 'name' },
    })
    .populate('submissionCount');

  if (!assignment) throw new AppError('Assignment not found', STATUS_CODES.NOT_FOUND);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: { assignment },
  });
});

/**
 * Delete assignment (faculty who created it, or admin)
 * DELETE /api/assignments/:id
 */
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found', STATUS_CODES.NOT_FOUND);

  // Only the creating faculty or admin can delete
  if (req.user.role === 'Faculty') {
    const facultyId = await resolveFacultyId(req.user);
    if (assignment.faculty.toString() !== facultyId?.toString()) {
      throw new AppError('You can only delete your own assignments', STATUS_CODES.FORBIDDEN);
    }
  }

  // Delete all submissions for this assignment
  await Submission.deleteMany({ assignment: assignment._id });
  await Assignment.findByIdAndDelete(req.params.id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Assignment and its submissions deleted',
  });
});

// ─────────────────────────────────────────────
// Submissions
// ─────────────────────────────────────────────

/**
 * Submit assignment (Student uploads file)
 * POST /api/assignments/:id/submit
 */
const submitAssignment = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError('Assignment not found', STATUS_CODES.NOT_FOUND);

  if (!req.file) {
    throw new AppError('Submission file is required', STATUS_CODES.BAD_REQUEST);
  }

  // Resolve student
  const student = await Student.findOne({ user: req.user.id });
  if (!student) throw new AppError('Student profile not found', STATUS_CODES.NOT_FOUND);

  // Check if already submitted
  const existing = await Submission.findOne({ assignment: assignmentId, student: student._id });
  if (existing) {
    throw new AppError('You have already submitted this assignment', STATUS_CODES.CONFLICT);
  }

  // Check if late
  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await Submission.create({
    assignment: assignmentId,
    student: student._id,
    filePath: req.file.path.replace(/\\/g, '/'),
    originalFileName: req.file.originalname,
    status: isLate ? 'Late' : 'Submitted',
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: isLate ? 'Assignment submitted (late)' : 'Assignment submitted successfully',
    data: { submission },
  });
});

/**
 * Get submissions for an assignment (Faculty view)
 * GET /api/assignments/:id/submissions
 */
const getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.id })
    .populate({
      path: 'student',
      select: 'enrollmentNumber',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ submittedAt: -1 });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    count: submissions.length,
    data: { submissions },
  });
});

/**
 * Get my submission for an assignment (Student view)
 * GET /api/assignments/:id/my-submission
 */
const getMySubmission = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user.id });
  if (!student) throw new AppError('Student profile not found', STATUS_CODES.NOT_FOUND);

  const submission = await Submission.findOne({
    assignment: req.params.id,
    student: student._id,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: { submission },
  });
});

/**
 * Grade a submission (Faculty)
 * PATCH /api/assignments/submissions/:submissionId/grade
 */
const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;

  if (marks === undefined || marks === null) {
    throw new AppError('Marks are required', STATUS_CODES.BAD_REQUEST);
  }

  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) throw new AppError('Submission not found', STATUS_CODES.NOT_FOUND);

  submission.marks = marks;
  submission.feedback = feedback || '';
  submission.status = 'Graded';
  await submission.save();

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Submission graded',
    data: { submission },
  });
});

/**
 * Get all assignments for the logged-in student's subjects
 * GET /api/assignments/student/my-assignments
 */
const getStudentAssignments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user.id });
  if (!student) throw new AppError('Student profile not found', STATUS_CODES.NOT_FOUND);

  // Get assignments for every subject the student is enrolled in
  const assignments = await Assignment.find({
    subject: { $in: student.subjects },
  })
    .populate('subject', 'subjectName subjectCode')
    .populate({
      path: 'faculty',
      select: 'employeeId',
      populate: { path: 'user', select: 'name' },
    })
    .sort({ dueDate: -1 });

  // Get this student's submissions
  const assignmentIds = assignments.map((a) => a._id);
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
    student: student._id,
  });

  // Map submissionsByAssignment for easy lookup
  const submissionMap = {};
  submissions.forEach((s) => {
    submissionMap[s.assignment.toString()] = s;
  });

  // Attach submission info to each assignment
  const enriched = assignments.map((a) => ({
    ...a.toObject(),
    mySubmission: submissionMap[a._id.toString()] || null,
  }));

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    count: enriched.length,
    data: { assignments: enriched },
  });
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmission,
  gradeSubmission,
  getStudentAssignments,
};
