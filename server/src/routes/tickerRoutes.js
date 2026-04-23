const express = require('express');
const router = express.Router();
const tickerController = require('../controllers/tickerController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, tickerController.getAll);
router.get('/:id', authenticate, tickerController.getById);
router.post('/', authenticate, authorize('admin'), tickerController.create);
router.put('/:id', authenticate, authorize('admin'), tickerController.update);

module.exports = router;
