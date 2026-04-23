const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, scheduleController.getAll);
router.get('/active', authenticate, scheduleController.getActive);
router.post('/', authenticate, authorize('admin'), scheduleController.create);

module.exports = router;
