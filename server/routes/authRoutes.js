const express = require('express');
const router = express.Router();
const { login, getAllUsers, toggleUserStatus, createUser, unlockUser, lockUser, deleteUser, requestPasswordReset, approveResetRequest } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', createUser);
router.get('/users', getAllUsers);
router.post('/users/:id/status', toggleUserStatus);
router.post('/users/:id/unlock', unlockUser);
router.post('/users/:id/lock', lockUser);
router.delete('/users/:id', deleteUser);
router.post('/request-reset', requestPasswordReset);
router.post('/users/:id/approve-reset', approveResetRequest);

module.exports = router;
