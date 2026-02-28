const AuditLog = require('../models/AuditLog');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { STATUS_CODES } = require('../config/constants');

/**
 * Get all audit logs (Admin only)
 * GET /api/audit-logs
 * Query params: action, targetModel, performedBy, page, limit
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, targetModel, performedBy, page = 1, limit = 30 } = req.query;

  const query = {};
  if (action) query.action = action;
  if (targetModel) query.targetModel = targetModel;
  if (performedBy) query.performedBy = performedBy;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: logs.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    data: logs,
  });
});

/**
 * Get audit log stats (Admin only)
 * GET /api/audit-logs/stats
 */
const getAuditStats = asyncHandler(async (req, res) => {
  const [byAction, byModel, recentCount] = await Promise.all([
    AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.aggregate([
      { $group: { _id: '$targetModel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);

  const totalLogs = await AuditLog.countDocuments();

  res.json({
    success: true,
    data: {
      totalLogs,
      last24Hours: recentCount,
      byAction,
      byModel,
    },
  });
});

/**
 * Get single audit log by ID
 * GET /api/audit-logs/:id
 */
const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id)
    .populate('performedBy', 'name email role');

  if (!log) throw new AppError('Audit log not found', STATUS_CODES.NOT_FOUND);

  res.json({ success: true, data: log });
});

module.exports = {
  getAuditLogs,
  getAuditStats,
  getAuditLogById,
};
