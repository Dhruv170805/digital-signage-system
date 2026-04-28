const express = require('express');
const router = express.Router();
const audioAssignmentController = require('../controllers/audioAssignmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('admin', 'user'), audioAssignmentController.getAll);
router.post('/', protect, authorize('admin', 'user'), audioAssignmentController.create);
router.delete('/:id', protect, authorize('admin'), audioAssignmentController.delete);

module.exports = router;
