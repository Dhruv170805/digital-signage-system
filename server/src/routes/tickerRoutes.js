const express = require('express');
const router = express.Router();
const tickerController = require('../controllers/tickerController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', tickerController.getAll);
router.get('/active', tickerController.getAll);
router.post('/', authenticate, authorize('admin'), tickerController.create);
router.put('/:id', authenticate, authorize('admin'), tickerController.update);
router.put('/:id/toggle', authenticate, authorize('admin'), tickerController.toggle);
router.delete('/:id', authenticate, authorize('admin'), tickerController.delete);

module.exports = router;
