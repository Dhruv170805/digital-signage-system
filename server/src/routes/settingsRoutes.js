const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, configController.getAll);
router.post('/', authenticate, authorize('admin'), configController.update);

module.exports = router;
