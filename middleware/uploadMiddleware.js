const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

/* ── Storage config ──────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Assignments uploaded by faculty go to /uploads/assignments
    // Submissions uploaded by students go to /uploads/submissions
    const folder =
      req.uploadType === 'submission'
        ? 'uploads/submissions'
        : 'uploads/assignments';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/* ── File filter — allow only PDFs ───────────── */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF and Word documents are allowed', 400), false);
  }
};

/* ── Multer instances ────────────────────────── */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Middleware: set upload type so multer destination knows the folder.
 */
const setUploadType = (type) => (req, _res, next) => {
  req.uploadType = type;
  next();
};

module.exports = { upload, setUploadType };
