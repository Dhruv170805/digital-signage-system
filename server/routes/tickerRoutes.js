const express = require('express');
const router = express.Router();
const { getAllTickers, getActiveTickers, createTicker, updateTicker, deleteTicker, toggleTickerStatus } = require('../controllers/tickerController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, isAdmin, getAllTickers);
router.get('/active', getActiveTickers);
router.post('/', verifyToken, isAdmin, createTicker);
router.put('/:id', verifyToken, isAdmin, updateTicker);
router.delete('/:id', verifyToken, isAdmin, deleteTicker);
router.put('/:id/toggle', verifyToken, isAdmin, toggleTickerStatus);

module.exports = router;
