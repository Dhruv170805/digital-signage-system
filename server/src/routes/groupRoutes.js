const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, groupController.getAll);
router.post('/', authenticate, authorize('admin'), groupController.create);
router.delete('/:id', authenticate, authorize('admin'), groupController.delete);

module.exports = router;
