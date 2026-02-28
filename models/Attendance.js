const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: [true, 'Status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'MarkedBy (Faculty) reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance for same student, subject, date
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

// Index for faster queries
attendanceSchema.index({ student: 1 });
attendanceSchema.index({ subject: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
