const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { getAllMedia, uploadMedia, approveMedia, rejectMedia, getPendingMedia, resubmitMedia } = require('../controllers/mediaController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        cb(null, 'nexus-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.webm', '.mov'];
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm', 'video/quicktime'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file format or restricted file type.'));
        }
    }
});

router.get('/', getAllMedia);
router.get('/pending', verifyToken, isAdmin, getPendingMedia);
router.post('/upload', verifyToken, upload.single('media'), uploadMedia);
router.post('/:id/approve', verifyToken, isAdmin, approveMedia);
router.post('/:id/reject', verifyToken, isAdmin, rejectMedia);
router.post('/:id/resubmit', verifyToken, resubmitMedia);

module.exports = router;
