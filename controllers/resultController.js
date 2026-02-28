const Result = require('../models/Result');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');
const logAudit = require('../utils/auditLogger');

/**
 * Calculate grade based on total marks
 * @param {number} totalMarks
 * @returns {string} grade
 */
const calculateGrade = (totalMarks) => {
  if (totalMarks >= 90) return 'A+';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B+';
  if (totalMarks >= 60) return 'B';
  if (totalMarks >= 50) return 'C+';
  if (totalMarks >= 40) return 'C';
  if (totalMarks >= 33) return 'D';
  return 'F';
};

/**
 * Add marks / Create result
 * POST /api/results
 */
const addMarks = asyncHandler(async (req, res, next) => {
  const { student, subject, internalMarks, externalMarks, semester } = req.body;

  // Validate required fields
  if (!student || !subject || internalMarks === undefined || externalMarks === undefined || !semester) {
    throw new AppError(
      'Student, subject, internalMarks, externalMarks, and semester are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  // Check if result already exists
  const existingResult = await Result.findOne({ student, subject, semester });
  if (existingResult) {
    throw new AppError(
      'Result already exists for this student and subject',
      STATUS_CODES.CONFLICT
    );
  }

  // Create result (totalMarks and grade calculated automatically via pre-save hook)
  const result = await Result.create({
    student,
    subject,
    internalMarks,
    externalMarks,
    semester,
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Marks added successfully',
    data: {
      result,
    },
  });
});

/**
 * Add bulk marks
 * POST /api/results/bulk
 */
const addBulkMarks = asyncHandler(async (req, res, next) => {
  const { results } = req.body;

  if (!results || !Array.isArray(results) || results.length === 0) {
    throw new AppError(
      'Results array is required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  // Process each result and calculate totalMarks and grade
  const processedResults = results.map((r) => ({
    ...r,
    totalMarks: r.internalMarks + r.externalMarks,
    grade: calculateGrade(r.internalMarks + r.externalMarks),
  }));

  // Use insertMany with ordered: false to continue on errors
  const insertedResults = await Result.insertMany(processedResults, { ordered: false });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Bulk marks added successfully',
    data: {
      count: insertedResults.length,
      results: insertedResults,
    },
  });
});

/**
 * Update marks
 * PATCH /api/results/:id
 */
const updateMarks = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { internalMarks, externalMarks } = req.body;

  // Find existing result
  const result = await Result.findById(id);
  if (!result) {
    throw new AppError('Result not found', STATUS_CODES.NOT_FOUND);
  }

  // Capture old values for audit
  const oldValues = { internalMarks: result.internalMarks, externalMarks: result.externalMarks, totalMarks: result.totalMarks, grade: result.grade };

  // Update marks
  if (internalMarks !== undefined) result.internalMarks = internalMarks;
  if (externalMarks !== undefined) result.externalMarks = externalMarks;

  // Save will trigger pre-save hook to recalculate totalMarks and grade
  await result.save();

  // Audit log
  logAudit({
    action: 'UPDATE_MARKS',
    performedBy: req.user.id,
    targetModel: 'Result',
    targetId: result._id,
    description: `Updated marks for result ${result._id}`,
    details: { oldValues, newValues: { internalMarks: result.internalMarks, externalMarks: result.externalMarks, totalMarks: result.totalMarks, grade: result.grade } },
    ipAddress: req.ip,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Marks updated successfully',
    data: {
      result,
    },
  });
});

/**
 * Get student results
 * GET /api/results/student/:studentId
 */
const getStudentResults = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { semester } = req.query;

  // Build query
  const query = { student: studentId };
  if (semester) {
    query.semester = semester;
  }

  const results = await Result.find(query)
    .populate('subject', 'subjectName subjectCode credits')
    .sort({ semester: 1, subject: 1 });

  // Calculate statistics
  const totalSubjects = results.length;
  const totalMarksObtained = results.reduce((sum, r) => sum + r.totalMarks, 0);
  const totalMaxMarks = totalSubjects * 100;
  const percentage = totalSubjects > 0 ? ((totalMarksObtained / totalMaxMarks) * 100).toFixed(2) : 0;

  // Calculate SGPA (assuming 10-point scale)
  const gradePoints = {
    'A+': 10,
    'A': 9,
    'B+': 8,
    'B': 7,
    'C+': 6,
    'C': 5,
    'D': 4,
    'F': 0,
  };

  let totalCredits = 0;
  let totalGradePoints = 0;

  results.forEach((r) => {
    const credits = r.subject?.credits || 3;
    totalCredits += credits;
    totalGradePoints += gradePoints[r.grade] * credits;
  });

  const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      results,
      statistics: {
        totalSubjects,
        totalMarksObtained,
        totalMaxMarks,
        percentage: parseFloat(percentage),
        sgpa: parseFloat(sgpa),
      },
    },
  });
});

/**
 * Get result by subject
 * GET /api/results/subject/:subjectId
 */
const getResultsBySubject = asyncHandler(async (req, res, next) => {
  const { subjectId } = req.params;
  const { semester } = req.query;

  // Build query
  const query = { subject: subjectId };
  if (semester) {
    query.semester = semester;
  }

  const results = await Result.find(query)
    .populate({
      path: 'student',
      select: 'enrollmentNumber',
      populate: {
        path: 'user',
        select: 'name email',
      },
    })
    .sort({ totalMarks: -1 });

  // Calculate class statistics
  const totalStudents = results.length;
  const passedStudents = results.filter((r) => r.grade !== 'F').length;
  const failedStudents = totalStudents - passedStudents;
  const avgMarks = totalStudents > 0
    ? (results.reduce((sum, r) => sum + r.totalMarks, 0) / totalStudents).toFixed(2)
    : 0;
  const highestMarks = totalStudents > 0 ? Math.max(...results.map((r) => r.totalMarks)) : 0;
  const lowestMarks = totalStudents > 0 ? Math.min(...results.map((r) => r.totalMarks)) : 0;

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      results,
      statistics: {
        totalStudents,
        passedStudents,
        failedStudents,
        passPercentage: totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(2) : 0,
        avgMarks: parseFloat(avgMarks),
        highestMarks,
        lowestMarks,
      },
    },
  });
});

/**
 * Delete result
 * DELETE /api/results/:id
 */
const deleteResult = asyncHandler(async (req, res, next) => {
  const result = await Result.findByIdAndDelete(req.params.id);

  if (!result) {
    throw new AppError('Result not found', STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Result deleted successfully',
  });
});

module.exports = {
  addMarks,
  addBulkMarks,
  updateMarks,
  getStudentResults,
  getResultsBySubject,
  deleteResult,
};
