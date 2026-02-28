const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const resultRoutes = require('./routes/resultRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

// Trust first proxy (required for rate-limit & secure cookies behind Render / Railway)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/**
 * Middleware Setup
 */

// ── Helmet — sets various HTTP security headers ──
app.use(
  helmet({
    contentSecurityPolicy: false,       // disabled so React SPA scripts load
    crossOriginEmbedderPolicy: false,   // allow loading uploads
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS — restrict origins in production ──
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5000'];

// In production on Vercel, allow same-origin requests
if (process.env.VERCEL) {
  allowedOrigins.push(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
}

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ──
const rlWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const rlMax      = parseInt(process.env.RATE_LIMIT_MAX, 10)       || 100;
const authMax    = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10)   || 10;

// Global limiter
const globalLimiter = rateLimit({
  windowMs: rlWindowMs,
  max: rlMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
  },
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: rlWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body parsers with size limits ──
app.use(express.json({ limit: '10kb' }));                   // prevent large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL injection sanitizer — strips $ and . from user input ──
app.use(mongoSanitize());

// ── HTTP parameter pollution protection ──
app.use(hpp());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Routes
 */

// Health check route (used by Render / Railway to verify the service is alive)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

/**
 * Serve React frontend (production)
 * The built React app lives in client/dist after running "npm run build"
 */
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback: any non-API route → React's index.html
app.get(/^\/(?!api).*/, (req, res, next) => {
  const indexPath = path.join(clientDist, 'index.html');
  // eslint-disable-next-line no-undef
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

/**
 * 404 handler — any route that wasn't matched above
 */
app.use(notFoundHandler);

/**
 * Global error handling middleware (must be last)
 */
app.use(errorHandler);

module.exports = app;
