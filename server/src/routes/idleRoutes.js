const express = require('express');
const router = express.Router();
const idleController = require('../controllers/idleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), idleController.getAll);
router.post('/', authenticate, authorize('admin', 'operator'), idleController.create);
router.put('/:id', authenticate, authorize('admin', 'operator'), idleController.update);
router.delete('/:id', authenticate, authorize('admin'), idleController.delete);

module.exports = router;
