const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { protect, admin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.get('/', mediaController.getAll);
router.get('/pending', protect, admin, mediaController.getPending);
router.post('/upload', protect, upload.single('media'), mediaController.upload);
router.post('/:id/approve', protect, admin, mediaController.approve);
router.post('/:id/reject', protect, admin, mediaController.reject);

module.exports = router;
