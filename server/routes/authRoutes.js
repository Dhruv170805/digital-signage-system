const express = require('express');
const router = express.Router();
const { login, getAllUsers, toggleUserStatus, createUser } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', createUser);
router.get('/users', getAllUsers);
router.post('/users/:id/status', toggleUserStatus);

module.exports = router;
