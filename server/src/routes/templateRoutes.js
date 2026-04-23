const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, templateController.getAll);
router.get('/:id', authenticate, templateController.getById);
router.post('/', authenticate, authorize('admin'), templateController.create);
router.put('/:id', authenticate, authorize('admin'), templateController.update);
router.delete('/:id', authenticate, authorize('admin'), templateController.delete);

module.exports = router;
