const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../../uploads/audio/');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    cb(null, `audio-${Date.now()}-${safeName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

router.get('/', protect, authorize('admin', 'user'), audioController.getAllApproved);
router.get('/pending', protect, authorize('admin'), audioController.getPending);
router.post('/upload', protect, authorize('admin', 'user'), upload.single('audio'), audioController.upload);
router.post('/:id/approve', protect, authorize('admin'), audioController.approve);
router.post('/:id/reject', protect, authorize('admin'), audioController.reject);
router.delete('/:id', protect, authorize('admin'), audioController.delete);

module.exports = router;
