const express = require('express');
const router = express.Router();
const auditController = require('../controllers/historyController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), auditController.getAll);

module.exports = router;
