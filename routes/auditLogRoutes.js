const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAuditLogs,
  getAuditStats,
  getAuditLogById,
} = require('../controllers/auditLogController');

// All routes require authentication + Admin role
router.use(authenticate);
router.use(authorize('Admin'));

router.get('/stats', getAuditStats);
router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

module.exports = router;
