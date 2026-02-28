const User = require('../models/User');
const Student = require('../models/Student');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');
const logAudit = require('../utils/auditLogger');

/**
 * Create student  (Admin only)
 * Creates a User (role: Student) + linked Student profile
 * POST /api/students
 */
const createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    department,
    enrollmentNumber,
    course,
    semester,
    guardianName,
    guardianPhone,
  } = req.body;

  if (!name || !email || !password || !enrollmentNumber || !course || !semester) {
    throw new AppError(
      'name, email, password, enrollmentNumber, course, and semester are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  // Check duplicates
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered', STATUS_CODES.CONFLICT);

  const existingEnroll = await Student.findOne({ enrollmentNumber });
  if (existingEnroll) throw new AppError('Enrollment number already exists', STATUS_CODES.CONFLICT);

  // Create user account
  const user = await User.create({
    name,
    email,
    password,
    role: 'Student',
    department,
  });

  // Create student profile
  const student = await Student.create({
    user: user._id,
    enrollmentNumber,
    course,
    semester,
    guardianDetails: {
      name: guardianName || '',
      phone: guardianPhone || '',
    },
  });

  // Populate user info for the response
  await student.populate('user', 'name email department');

  // Audit log
  logAudit({
    action: 'CREATE_STUDENT',
    performedBy: req.user.id,
    targetModel: 'Student',
    targetId: student._id,
    description: `Created student ${name} (${enrollmentNumber})`,
    details: { email, enrollmentNumber, course, semester },
    ipAddress: req.ip,
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Student created successfully',
    data: { student },
  });
});

/**
 * Get all students
 * GET /api/students
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const { course, semester } = req.query;

  const query = {};
  if (course) query.course = course;
  if (semester) query.semester = Number(semester);

  const students = await Student.find(query)
    .populate('user', 'name email department')
    .populate('subjects', 'subjectName subjectCode')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: students.length,
    data: { students },
  });
});

/**
 * Get student by ID
 * GET /api/students/:id
 */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', 'name email department')
    .populate('subjects', 'subjectName subjectCode');

  if (!student) throw new AppError('Student not found', STATUS_CODES.NOT_FOUND);

  res.status(200).json({
    success: true,
    data: { student },
  });
});

/**
 * Update student
 * PATCH /api/students/:id
 */
const updateStudent = asyncHandler(async (req, res) => {
  const { course, semester, guardianName, guardianPhone, name, department } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Student not found', STATUS_CODES.NOT_FOUND);

  // Update student profile fields
  if (course) student.course = course;
  if (semester) student.semester = semester;
  if (guardianName !== undefined || guardianPhone !== undefined) {
    student.guardianDetails = {
      name: guardianName ?? student.guardianDetails?.name,
      phone: guardianPhone ?? student.guardianDetails?.phone,
    };
  }
  await student.save();

  // Update linked user fields if provided
  if (name || department) {
    const update = {};
    if (name) update.name = name;
    if (department) update.department = department;
    await User.findByIdAndUpdate(student.user, update);
  }

  await student.populate('user', 'name email department');

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    data: { student },
  });
});

/**
 * Delete student + user account
 * DELETE /api/students/:id
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Student not found', STATUS_CODES.NOT_FOUND);

  const studentInfo = { enrollmentNumber: student.enrollmentNumber, course: student.course };
  await User.findByIdAndDelete(student.user);
  await Student.findByIdAndDelete(req.params.id);

  // Audit log
  logAudit({
    action: 'DELETE_STUDENT',
    performedBy: req.user.id,
    targetModel: 'Student',
    targetId: req.params.id,
    description: `Deleted student ${studentInfo.enrollmentNumber}`,
    details: studentInfo,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
  });
});

/**
 * Get current student's own profile
 * GET /api/students/me/profile
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user.id })
    .populate('user', 'name email department')
    .populate('subjects', 'subjectName subjectCode department semester credits');

  if (!student) throw new AppError('Student profile not found', STATUS_CODES.NOT_FOUND);

  res.status(200).json({
    success: true,
    data: { student },
  });
});

/**
 * Get students enrolled in a specific subject
 * GET /api/students/by-subject/:subjectId
 */
const getStudentsBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const students = await Student.find({ subjects: subjectId })
    .populate('user', 'name email department')
    .sort({ enrollmentNumber: 1 });

  res.status(200).json({
    success: true,
    count: students.length,
    data: { students },
  });
});

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsBySubject,
  getMyProfile,
};
