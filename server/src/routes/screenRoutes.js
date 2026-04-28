const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const screenAuth = require('../middlewares/screenAuth');

router.get('/', authenticate, authorize('admin', 'user'), screenController.getAll);
router.get('/live-status', authenticate, authorize('admin', 'user'), screenController.getLiveStatus);
router.get('/public-manifest', screenController.getPublicManifest);
router.get('/me', screenAuth, screenController.getMe);
router.get('/manifest', screenAuth, screenController.getManifest);
router.get('/:id', authenticate, authorize('admin', 'user'), screenController.getById);
router.post('/register', authenticate, authorize('admin'), screenController.register);
router.put('/:id', authenticate, authorize('admin'), screenController.update);
router.delete('/:id', authenticate, authorize('admin'), screenController.delete);
router.post('/reset', authenticate, authorize('admin'), screenController.resetScreen);

module.exports = router;
