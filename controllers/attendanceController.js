const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');

/**
 * Helper — resolve the Faculty _id from the authenticated user
 */
const resolveFacultyId = async (user) => {
  if (user.facultyId) return user.facultyId;
  const faculty = await Faculty.findOne({ user: user.id });
  return faculty?._id || null;
};

/**
 * Mark attendance
 * POST /api/attendance
 */
const markAttendance = asyncHandler(async (req, res, next) => {
  const { student, subject, date, status } = req.body;

  // Validate required fields
  if (!student || !subject || !status) {
    throw new AppError(
      'Student, subject, and status are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  // Check if attendance already marked for this student, subject, date
  const existingAttendance = await Attendance.findOne({
    student,
    subject,
    date: date ? new Date(date).setHours(0, 0, 0, 0) : new Date().setHours(0, 0, 0, 0),
  });

  if (existingAttendance) {
    throw new AppError(
      'Attendance already marked for this student on this date',
      STATUS_CODES.CONFLICT
    );
  }

  // Create attendance record
  const attendance = await Attendance.create({
    student,
    subject,
    date: date || new Date(),
    status,
    markedBy: await resolveFacultyId(req.user),
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Attendance marked successfully',
    data: {
      attendance,
    },
  });
});

/**
 * Mark bulk attendance
 * POST /api/attendance/bulk
 */
const markBulkAttendance = asyncHandler(async (req, res, next) => {
  const { subject, date, attendanceRecords } = req.body;

  // Validate required fields
  if (!subject || !attendanceRecords || !Array.isArray(attendanceRecords)) {
    throw new AppError(
      'Subject and attendanceRecords array are required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  const attendanceDate = date ? new Date(date) : new Date();
  const markedBy = await resolveFacultyId(req.user);

  // Prepare bulk operations
  const bulkOps = attendanceRecords.map((record) => ({
    updateOne: {
      filter: {
        student: record.student,
        subject,
        date: attendanceDate,
      },
      update: {
        $set: {
          status: record.status,
          markedBy,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(bulkOps);

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: 'Bulk attendance marked successfully',
    data: {
      count: attendanceRecords.length,
    },
  });
});

/**
 * Get attendance by student
 * GET /api/attendance/student/:studentId
 */
const getAttendanceByStudent = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { subject, startDate, endDate } = req.query;

  // Build query
  const query = { student: studentId };

  if (subject) {
    query.subject = subject;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const attendance = await Attendance.find(query)
    .populate('subject', 'subjectName subjectCode')
    .populate('markedBy', 'employeeId')
    .sort({ date: -1 });

  // Calculate attendance statistics
  const totalClasses = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = totalClasses - presentCount;
  const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      attendance,
      statistics: {
        totalClasses,
        present: presentCount,
        absent: absentCount,
        percentage: parseFloat(percentage),
      },
    },
  });
});

/**
 * Get attendance by subject
 * GET /api/attendance/subject/:subjectId
 */
const getAttendanceBySubject = asyncHandler(async (req, res, next) => {
  const { subjectId } = req.params;
  const { date, startDate, endDate } = req.query;

  // Build query
  const query = { subject: subjectId };

  if (date) {
    const targetDate = new Date(date);
    query.date = {
      $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
    };
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: 'student',
      select: 'enrollmentNumber',
      populate: {
        path: 'user',
        select: 'name email',
      },
    })
    .populate('markedBy', 'employeeId')
    .sort({ date: -1 });

  // Calculate statistics
  const totalRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = totalRecords - presentCount;

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      attendance,
      statistics: {
        totalRecords,
        present: presentCount,
        absent: absentCount,
      },
    },
  });
});

/**
 * Update attendance
 * PATCH /api/attendance/:id
 */
const updateAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Present', 'Absent'].includes(status)) {
    throw new AppError(
      'Valid status (Present/Absent) is required',
      STATUS_CODES.BAD_REQUEST
    );
  }

  const attendance = await Attendance.findByIdAndUpdate(
    id,
    { status, markedBy: await resolveFacultyId(req.user) },
    { new: true, runValidators: true }
  );

  if (!attendance) {
    throw new AppError('Attendance record not found', STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Attendance updated successfully',
    data: {
      attendance,
    },
  });
});

/**
 * Delete attendance
 * DELETE /api/attendance/:id
 */
const deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findByIdAndDelete(req.params.id);

  if (!attendance) {
    throw new AppError('Attendance record not found', STATUS_CODES.NOT_FOUND);
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Attendance deleted successfully',
  });
});

module.exports = {
  markAttendance,
  markBulkAttendance,
  getAttendanceByStudent,
  getAttendanceBySubject,
  updateAttendance,
  deleteAttendance,
};
