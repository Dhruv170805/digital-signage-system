const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), groupController.getAll);
router.post('/', authenticate, authorize('admin', 'operator'), groupController.create);
router.delete('/:id', authenticate, authorize('admin'), groupController.delete);

module.exports = router;
