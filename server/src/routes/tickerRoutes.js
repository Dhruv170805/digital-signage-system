const express = require('express');
const router = express.Router();
const tickerController = require('../controllers/tickerController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), tickerController.getAll);
router.get('/active', tickerController.getAll); // Leave public for screens
router.post('/', authenticate, authorize('admin', 'operator'), tickerController.create);
router.put('/:id', authenticate, authorize('admin', 'operator'), tickerController.update);
router.put('/:id/toggle', authenticate, authorize('admin', 'operator'), tickerController.toggle);
router.delete('/:id', authenticate, authorize('admin'), tickerController.delete);

module.exports = router;
