const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllMedia, uploadMedia, approveMedia, rejectMedia, getPendingMedia } = require('../controllers/mediaController');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'nexus-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.webm', '.mov'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Format not supported'));
        }
    }
});

router.get('/', getAllMedia);
router.get('/pending', getPendingMedia);
router.post('/upload', upload.single('media'), uploadMedia);
router.post('/:id/approve', approveMedia);
router.post('/:id/reject', rejectMedia);

module.exports = router;
