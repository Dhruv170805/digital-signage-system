const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/register', authenticate, authorize('admin'), authController.register);
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.post('/users/:id/lock', authenticate, authorize('admin'), authController.lockUser);
router.post('/users/:id/unlock', authenticate, authorize('admin'), authController.unlockUser);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
