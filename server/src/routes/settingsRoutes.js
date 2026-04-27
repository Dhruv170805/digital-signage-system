const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), configController.getAll);
router.post('/', authenticate, authorize('admin', 'operator'), configController.update);
router.post('/wipe', authenticate, authorize('admin'), configController.wipeSystem);

module.exports = router;
