const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_STUDENT',
        'UPDATE_STUDENT',
        'DELETE_STUDENT',
        'CREATE_FACULTY',
        'UPDATE_FACULTY',
        'DELETE_FACULTY',
        'CREATE_SUBJECT',
        'UPDATE_SUBJECT',
        'DELETE_SUBJECT',
        'ADD_MARKS',
        'UPDATE_MARKS',
        'DELETE_MARKS',
        'BULK_ADD_MARKS',
        'MARK_ATTENDANCE',
        'CREATE_ASSIGNMENT',
        'DELETE_ASSIGNMENT',
        'GRADE_SUBMISSION',
        'SEND_NOTIFICATION',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetModel: {
      type: String,
      enum: ['Student', 'Faculty', 'Subject', 'Result', 'Attendance', 'Assignment', 'Notification'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetModel: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
