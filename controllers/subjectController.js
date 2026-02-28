const Subject = require('../models/Subject');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');
const logAudit = require('../utils/auditLogger');

/**
 * Create subject (Admin only)
 * POST /api/subjects
 */
const createSubject = asyncHandler(async (req, res, next) => {
  const { subjectName, subjectCode, department, semester, assignedFaculty, credits } = req.body;

  if (!subjectName || !subjectCode || !department || !semester || !credits) {
    throw new AppError(
      'subjectName, subjectCode, department, semester, and credits are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  const existing = await Subject.findOne({ subjectCode });
  if (existing) {
    throw new AppError('Subject with this code already exists', STATUS_CODES.CONFLICT);
  }

  const subject = await Subject.create({
    subjectName,
    subjectCode,
    department,
    semester,
    assignedFaculty,
    credits,
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Subject created successfully',
    data: { subject },
  });
});

/**
 * Get all subjects
 * GET /api/subjects
 */
const getAllSubjects = asyncHandler(async (req, res, next) => {
  const { department, semester } = req.query;

  const query = {};
  if (department) query.department = department;
  if (semester) query.semester = semester;

  const subjects = await Subject.find(query)
    .populate({
      path: 'assignedFaculty',
      select: 'employeeId department',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ department: 1, semester: 1 });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    count: subjects.length,
    data: { subjects },
  });
});

/**
 * Get subject by ID
 * GET /api/subjects/:id
 */
const getSubjectById = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id).populate({
    path: 'assignedFaculty',
    select: 'employeeId department',
    populate: { path: 'user', select: 'name email' },
  });

  if (!subject) {
    throw new AppError('Subject not found', STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: { subject },
  });
});

/**
 * Update subject (Admin only)
 * PATCH /api/subjects/:id
 */
const updateSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!subject) {
    throw new AppError('Subject not found', STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Subject updated successfully',
    data: { subject },
  });
});

/**
 * Delete subject (Admin only)
 * DELETE /api/subjects/:id
 */
const deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    throw new AppError('Subject not found', STATUS_CODES.NOT_FOUND);
  }

  const subjectInfo = { subjectName: subject.subjectName, subjectCode: subject.subjectCode, department: subject.department };
  await subject.deleteOne();

  // Audit log
  logAudit({
    action: 'DELETE_SUBJECT',
    performedBy: req.user.id,
    targetModel: 'Subject',
    targetId: req.params.id,
    description: `Deleted subject ${subjectInfo.subjectName} (${subjectInfo.subjectCode})`,
    details: subjectInfo,
    ipAddress: req.ip,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Subject deleted successfully',
  });
});

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
