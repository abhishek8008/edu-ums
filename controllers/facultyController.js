const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');

/**
 * Create faculty (Admin only)
 * Creates a User (role: Faculty) + linked Faculty profile
 * POST /api/faculty
 */
const createFaculty = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    department,
    employeeId,
    qualification,
    experience,
  } = req.body;

  if (!name || !email || !password || !employeeId || !department) {
    throw new AppError(
      'name, email, password, employeeId, and department are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered', STATUS_CODES.CONFLICT);

  const existingEmp = await Faculty.findOne({ employeeId });
  if (existingEmp) throw new AppError('Employee ID already exists', STATUS_CODES.CONFLICT);

  // Create user account
  const user = await User.create({
    name,
    email,
    password,
    role: 'Faculty',
    department,
  });

  // Create faculty profile
  const faculty = await Faculty.create({
    user: user._id,
    employeeId,
    department,
    qualification: qualification || '',
    experience: experience || 0,
  });

  await faculty.populate('user', 'name email department');

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Faculty created successfully',
    data: { faculty },
  });
});

/**
 * Get all faculty
 * GET /api/faculty
 */
const getAllFaculty = asyncHandler(async (req, res) => {
  const { department } = req.query;

  const query = {};
  if (department) query.department = department;

  const faculty = await Faculty.find(query)
    .populate('user', 'name email department')
    .populate('subjectsTeaching', 'subjectName subjectCode')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: faculty.length,
    data: { faculty },
  });
});

/**
 * Get faculty by ID
 * GET /api/faculty/:id
 */
const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
    .populate('user', 'name email department')
    .populate('subjectsTeaching', 'subjectName subjectCode');

  if (!faculty) throw new AppError('Faculty not found', STATUS_CODES.NOT_FOUND);

  res.status(200).json({
    success: true,
    data: { faculty },
  });
});

/**
 * Update faculty
 * PATCH /api/faculty/:id
 */
const updateFaculty = asyncHandler(async (req, res) => {
  const { qualification, experience, name, department } = req.body;

  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new AppError('Faculty not found', STATUS_CODES.NOT_FOUND);

  if (qualification !== undefined) faculty.qualification = qualification;
  if (experience !== undefined) faculty.experience = experience;
  if (department) faculty.department = department;
  await faculty.save();

  // Update linked user fields
  if (name || department) {
    const update = {};
    if (name) update.name = name;
    if (department) update.department = department;
    await User.findByIdAndUpdate(faculty.user, update);
  }

  await faculty.populate('user', 'name email department');

  res.status(200).json({
    success: true,
    message: 'Faculty updated successfully',
    data: { faculty },
  });
});

/**
 * Delete faculty + user account
 * DELETE /api/faculty/:id
 */
const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new AppError('Faculty not found', STATUS_CODES.NOT_FOUND);

  await User.findByIdAndDelete(faculty.user);
  await Faculty.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Faculty deleted successfully',
  });
});

/**
 * Get logged-in faculty's profile
 * GET /api/faculty/me/profile
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user.id })
    .populate('user', 'name email department')
    .populate('subjectsTeaching', 'subjectName subjectCode');

  if (!faculty) throw new AppError('Faculty profile not found', STATUS_CODES.NOT_FOUND);

  res.status(200).json({ success: true, data: { faculty } });
});

/**
 * Get subjects assigned to the logged-in faculty
 * GET /api/faculty/me/subjects
 */
const getMySubjects = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user.id });
  if (!faculty) throw new AppError('Faculty profile not found', STATUS_CODES.NOT_FOUND);

  const subjects = await Subject.find({ assignedFaculty: faculty._id })
    .sort({ department: 1, semester: 1 });

  res.status(200).json({
    success: true,
    count: subjects.length,
    data: { subjects, facultyId: faculty._id },
  });
});

module.exports = {
  createFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  getMyProfile,
  getMySubjects,
};
