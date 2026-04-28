const express = require('express');
const router = express.Router();
const audioPlaylistController = require('../controllers/audioPlaylistController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('admin', 'user'), audioPlaylistController.getAll);
router.get('/:id', protect, authorize('admin', 'user'), audioPlaylistController.getById);
router.post('/', protect, authorize('admin', 'user'), audioPlaylistController.create);
router.put('/:id', protect, authorize('admin', 'user'), audioPlaylistController.update);
router.delete('/:id', protect, authorize('admin'), audioPlaylistController.delete);

module.exports = router;
