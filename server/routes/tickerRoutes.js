const express = require('express');
const router = express.Router();
const { getTicker, updateTicker } = require('../controllers/tickerController');

router.get('/', getTicker);
router.post('/', updateTicker);

module.exports = router;
