const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validateMiddleware');
const { z } = require('zod');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'user']).optional()
  })
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post('/register', authenticate, authorize('admin'), validate(registerSchema), authController.register);
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.post('/users/:id/lock', authenticate, authorize('admin'), authController.lockUser);
router.post('/users/:id/unlock', authenticate, authorize('admin'), authController.unlockUser);
router.post('/users/:id/approve-reset', authenticate, authorize('admin'), authController.approveReset);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
