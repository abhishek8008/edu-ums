const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event (fire-and-forget — never blocks the main request)
 *
 * @param {Object} opts
 * @param {string} opts.action        – e.g. 'CREATE_STUDENT'
 * @param {string} opts.performedBy   – User._id who performed the action
 * @param {string} opts.targetModel   – e.g. 'Student', 'Result', 'Subject'
 * @param {string} [opts.targetId]    – _id of the affected document
 * @param {string} opts.description   – human-readable summary
 * @param {Object} [opts.details]     – any extra payload (old/new values, etc.)
 * @param {string} [opts.ipAddress]   – request IP
 */
const logAudit = ({ action, performedBy, targetModel, targetId, description, details, ipAddress }) => {
  // Fire-and-forget: don't await, don't let logging errors break the request
  AuditLog.create({
    action,
    performedBy,
    targetModel,
    targetId: targetId || null,
    description,
    details: details || {},
    ipAddress: ipAddress || null,
  }).catch((err) => {
    console.error('Audit log error:', err.message);
  });
};

module.exports = logAudit;
