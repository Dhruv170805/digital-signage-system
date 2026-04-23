const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Only admins can view audit history
router.get('/', verifyToken, isAdmin, getAuditLogs);

module.exports = router;
