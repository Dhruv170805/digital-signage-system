const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllMedia, uploadMedia } = require('../controllers/mediaController');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', getAllMedia);
router.post('/upload', upload.single('media'), uploadMedia);

module.exports = router;
