const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../../uploads/');
    
    // Ensure directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(file.originalname).replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.get('/', protect, authorize('admin', 'operator', 'viewer'), mediaController.getAll);
router.get('/me', protect, authorize('admin', 'operator', 'viewer'), mediaController.getMyMedia);
router.get('/pending', protect, authorize('admin', 'operator'), mediaController.getPending);
router.post('/upload', protect, authorize('admin', 'operator'), upload.single('media'), mediaController.upload);
router.post('/:id/approve', protect, authorize('admin', 'operator'), mediaController.approve);
router.post('/:id/reject', protect, authorize('admin', 'operator'), mediaController.reject);
router.post('/:id/resubmit', protect, authorize('admin', 'operator'), mediaController.resubmit);
router.delete('/:id', protect, authorize('admin'), mediaController.delete);

module.exports = router;
