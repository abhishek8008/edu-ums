const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createAdminNotification,
  createFacultyNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getSentNotifications,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');
const { createNotificationValidator, createFacultyNotificationValidator, mongoIdParam } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

// ── Student routes (order matters – put specific paths before :id) ──
router.get('/my', authorize('Student'), getMyNotifications);
router.get('/unread-count', authorize('Student'), getUnreadCount);
router.patch('/read-all', authorize('Student'), markAllAsRead);
router.patch('/:id/read', authorize('Student'), mongoIdParam, markAsRead);

// ── Admin routes ──
router.post('/', authorize('Admin'), createNotificationValidator, createAdminNotification);

// ── Faculty routes ──
router.post('/subject', authorize('Faculty'), createFacultyNotificationValidator, createFacultyNotification);

// ── Shared: Admin & Faculty ──
router.get('/sent', authorize('Admin', 'Faculty'), getSentNotifications);
router.delete('/:id', authorize('Admin', 'Faculty'), mongoIdParam, deleteNotification);

module.exports = router;
