const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'user'), templateController.getAll);
router.get('/:id', authenticate, authorize('admin', 'user'), templateController.getById);
router.post('/', authenticate, authorize('admin', 'user'), templateController.create);
router.put('/:id', authenticate, authorize('admin', 'user'), templateController.update);
router.delete('/:id', authenticate, authorize('admin'), templateController.delete);

module.exports = router;
