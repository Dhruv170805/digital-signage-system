const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { protect, admin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const codeExtensions = ['.py', '.js', '.java', '.c', '.cpp', '.sh', '.html', '.css'];
    
    let dest = 'uploads/';
    if (codeExtensions.includes(ext)) {
      dest = 'test_codes/';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(file.originalname).replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

router.get('/', protect, admin, mediaController.getAll);
router.get('/me', protect, mediaController.getMyMedia);
router.get('/pending', protect, admin, mediaController.getPending);
router.post('/upload', protect, upload.single('media'), mediaController.upload);
router.post('/:id/approve', protect, admin, mediaController.approve);
router.post('/:id/reject', protect, admin, mediaController.reject);
router.post('/:id/resubmit', protect, mediaController.resubmit);

module.exports = router;
