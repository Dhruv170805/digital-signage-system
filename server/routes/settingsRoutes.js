const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, wipeSystem } = require('../controllers/settingsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.post('/', verifyToken, isAdmin, updateSettings);
router.post('/wipe', verifyToken, isAdmin, wipeSystem);

module.exports = router;
