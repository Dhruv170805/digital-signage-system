const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, screenController.getAll);
router.get('/:id', protect, screenController.getById);
router.get('/:id/playlist', screenController.getPlaylist); // Screens might not need JWT if using MacAddress/Socket, but typically they fetch playlist via ID
router.put('/:id', protect, admin, screenController.update);

module.exports = router;
