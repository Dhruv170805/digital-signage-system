const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const screenAuth = require('../middleware/screenAuth');

// Public/Screen identification
router.get('/me', screenAuth, screenController.getMe);

// Admin operations
router.get('/', screenController.getAllScreens);
router.post('/', screenController.registerScreen);
router.put('/:id', screenController.updateScreen);
router.post('/:id/reset-token', screenController.resetToken);

module.exports = router;
