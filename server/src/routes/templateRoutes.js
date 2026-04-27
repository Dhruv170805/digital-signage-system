const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), templateController.getAll);
router.get('/:id', authenticate, authorize('admin', 'operator', 'viewer'), templateController.getById);
router.post('/', authenticate, authorize('admin', 'operator'), templateController.create);
router.put('/:id', authenticate, authorize('admin', 'operator'), templateController.update);
router.delete('/:id', authenticate, authorize('admin'), templateController.delete);

module.exports = router;
