const express = require('express');
const router = express.Router();
const { getAllScreens, registerScreen, updateScreenStatus } = require('../controllers/screenController');

router.get('/', getAllScreens);
router.post('/register', registerScreen);
router.put('/:id/status', updateScreenStatus);

module.exports = router;
