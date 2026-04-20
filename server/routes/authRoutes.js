const express = require('express');
const router = express.Router();
const { login, createFirstUser } = require('../controllers/authController');

router.post('/login', login);
router.post('/setup-admin', createFirstUser); // Use once to create your temp id/pass

module.exports = router;
