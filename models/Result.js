const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
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
    internalMarks: {
      type: Number,
      required: [true, 'Internal marks are required'],
      min: [0, 'Internal marks cannot be negative'],
      max: [40, 'Internal marks cannot exceed 40'],
    },
    externalMarks: {
      type: Number,
      required: [true, 'External marks are required'],
      min: [0, 'External marks cannot be negative'],
      max: [60, 'External marks cannot exceed 60'],
    },
    totalMarks: {
      type: Number,
      min: [0, 'Total marks cannot be negative'],
      max: [100, 'Total marks cannot exceed 100'],
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate results for same student and subject
resultSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });

// Index for faster queries
resultSchema.index({ student: 1 });
resultSchema.index({ subject: 1 });
resultSchema.index({ semester: 1 });

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
 * Pre-save hook to calculate totalMarks and grade
 */
resultSchema.pre('save', function (next) {
  // Calculate total marks
  this.totalMarks = this.internalMarks + this.externalMarks;
  
  // Calculate grade
  this.grade = calculateGrade(this.totalMarks);
  
  next();
});

/**
 * Pre-update hook to recalculate totalMarks and grade
 */
resultSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  
  if (update.internalMarks !== undefined || update.externalMarks !== undefined) {
    // We need to get current values and calculate
    // This will be handled in controller for accuracy
  }
  
  next();
});

module.exports = mongoose.model('Result', resultSchema);
