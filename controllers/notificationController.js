const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');

/**
 * Helper: resolve Student doc from JWT user id
 */
const resolveStudentId = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new AppError('Student profile not found', STATUS_CODES.NOT_FOUND);
  return student._id;
};

/**
 * Helper: resolve Faculty doc from JWT user id
 */
const resolveFacultyId = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId });
  if (!faculty) throw new AppError('Faculty profile not found', STATUS_CODES.NOT_FOUND);
  return faculty;
};

/* ────────────────────────────────────────────
   ADMIN: Send notice to ALL students
   POST /api/notifications
   Body: { title, message }
   ──────────────────────────────────────────── */
const createAdminNotification = asyncHandler(async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    throw new AppError('Title and message are required', STATUS_CODES.BAD_REQUEST);
  }

  const notification = await Notification.create({
    title,
    message,
    sender: req.user.id,
    senderRole: 'Admin',
    targetType: 'all',
  });

  res.status(201).json({
    success: true,
    message: 'Notification sent to all students',
    data: notification,
  });
});

/* ────────────────────────────────────────────
   FACULTY: Send notice to subject students
   POST /api/notifications/subject
   Body: { title, message, subjectId }
   ──────────────────────────────────────────── */
const createFacultyNotification = asyncHandler(async (req, res) => {
  const { title, message, subjectId } = req.body;

  if (!title || !message || !subjectId) {
    throw new AppError('Title, message, and subjectId are required', STATUS_CODES.BAD_REQUEST);
  }

  // Verify the faculty teaches this subject
  const faculty = await resolveFacultyId(req.user.id);
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new AppError('Subject not found', STATUS_CODES.NOT_FOUND);
  }

  if (String(subject.faculty) !== String(faculty._id)) {
    throw new AppError('You can only send notices for your own subjects', STATUS_CODES.FORBIDDEN);
  }

  const notification = await Notification.create({
    title,
    message,
    sender: req.user.id,
    senderRole: 'Faculty',
    targetType: 'subject',
    subject: subjectId,
  });

  const populated = await Notification.findById(notification._id).populate('subject', 'name code');

  res.status(201).json({
    success: true,
    message: 'Notification sent to subject students',
    data: populated,
  });
});

/* ────────────────────────────────────────────
   STUDENT: Get my notifications
   GET /api/notifications/my
   Returns all-student broadcasts + subject-specific for enrolled subjects
   ──────────────────────────────────────────── */
const getMyNotifications = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const student = await Student.findById(studentId);

  // Notifications targeted to all students  OR  to subjects I'm enrolled in
  const notifications = await Notification.find({
    $or: [
      { targetType: 'all' },
      { targetType: 'subject', subject: { $in: student.subjects } },
    ],
  })
    .populate('subject', 'name code')
    .sort({ createdAt: -1 })
    .lean();

  // Attach read status for this student
  const enriched = notifications.map((n) => ({
    ...n,
    isRead: n.readBy.some((id) => String(id) === String(studentId)),
    readBy: undefined, // don't leak full readBy array
  }));

  const unreadCount = enriched.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    count: enriched.length,
    unreadCount,
    data: enriched,
  });
});

/* ────────────────────────────────────────────
   STUDENT: Mark notification as read
   PATCH /api/notifications/:id/read
   ──────────────────────────────────────────── */
const markAsRead = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError('Notification not found', STATUS_CODES.NOT_FOUND);
  }

  // Add student to readBy if not already there
  if (!notification.readBy.includes(studentId)) {
    notification.readBy.push(studentId);
    await notification.save();
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

/* ────────────────────────────────────────────
   STUDENT: Mark all notifications as read
   PATCH /api/notifications/read-all
   ──────────────────────────────────────────── */
const markAllAsRead = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const student = await Student.findById(studentId);

  await Notification.updateMany(
    {
      $or: [
        { targetType: 'all' },
        { targetType: 'subject', subject: { $in: student.subjects } },
      ],
      readBy: { $ne: studentId },
    },
    { $addToSet: { readBy: studentId } }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

/* ────────────────────────────────────────────
   ADMIN / FACULTY: Get sent notifications
   GET /api/notifications/sent
   ──────────────────────────────────────────── */
const getSentNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ sender: req.user.id })
    .populate('subject', 'name code')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

/* ────────────────────────────────────────────
   ADMIN / FACULTY: Delete a notification
   DELETE /api/notifications/:id
   ──────────────────────────────────────────── */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError('Notification not found', STATUS_CODES.NOT_FOUND);
  }

  // Only the sender can delete
  if (String(notification.sender) !== String(req.user.id)) {
    throw new AppError('You can only delete your own notifications', STATUS_CODES.FORBIDDEN);
  }

  await notification.deleteOne();

  res.json({ success: true, message: 'Notification deleted' });
});

/* ────────────────────────────────────────────
   STUDENT: Get unread count only (for badge)
   GET /api/notifications/unread-count
   ──────────────────────────────────────────── */
const getUnreadCount = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const student = await Student.findById(studentId);

  const count = await Notification.countDocuments({
    $or: [
      { targetType: 'all' },
      { targetType: 'subject', subject: { $in: student.subjects } },
    ],
    readBy: { $ne: studentId },
  });

  res.json({ success: true, unreadCount: count });
});

module.exports = {
  createAdminNotification,
  createFacultyNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getSentNotifications,
  deleteNotification,
  getUnreadCount,
};
