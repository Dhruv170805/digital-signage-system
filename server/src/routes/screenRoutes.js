const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const screenAuth = require('../middlewares/screenAuth');

router.get('/', authenticate, authorize('admin', 'operator', 'viewer'), screenController.getAll);
router.get('/live-status', authenticate, authorize('admin', 'operator', 'viewer'), screenController.getLiveStatus);
router.get('/public-manifest', screenController.getPublicManifest);
router.get('/me', screenAuth, screenController.getMe);
router.get('/manifest', screenAuth, screenController.getManifest);
router.get('/:id', authenticate, authorize('admin', 'operator', 'viewer'), screenController.getById);
router.post('/register', authenticate, authorize('admin', 'operator'), screenController.register);
router.put('/:id', authenticate, authorize('admin', 'operator'), screenController.update);
router.delete('/:id', authenticate, authorize('admin'), screenController.delete);
router.post('/reset', authenticate, authorize('admin', 'operator'), screenController.resetScreen);

module.exports = router;
