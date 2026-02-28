const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['Admin', 'Faculty'],
      required: true,
    },
    // 'all' → Admin broadcast to all students
    // 'subject' → Faculty notice to students of a specific subject
    targetType: {
      type: String,
      enum: ['all', 'subject'],
      required: true,
    },
    // Only required when targetType = 'subject'
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    // Track which students have read the notification
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationSchema.index({ targetType: 1, createdAt: -1 });
notificationSchema.index({ subject: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
