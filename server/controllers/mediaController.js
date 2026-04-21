const { poolPromise } = require('../config/db');

const getAllMedia = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute('SELECT * FROM Media WHERE status = "approved" ORDER BY uploadedAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPendingMedia = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute('SELECT M.*, U.name as uploaderName FROM Media M JOIN Users U ON M.uploaderId = U.id WHERE M.status = "pending" ORDER BY M.uploadedAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { filename, path: filePath, mimetype } = req.file;
        const { uploaderId } = req.body; // Expecting uploaderId from frontend
        
        let fileType = 'image';
        if (mimetype.includes('pdf')) fileType = 'pdf';
        if (mimetype.includes('video')) fileType = 'video';

        const pool = await poolPromise;
        await pool.execute(
            'INSERT INTO Media (fileName, filePath, fileType, uploaderId, status) VALUES (?, ?, ?, ?, ?)',
            [filename, filePath, fileType, uploaderId || null, Number(uploaderId) === 1 ? 'approved' : 'pending']
        );

        res.status(201).json({ message: 'File uploaded successfully', fileName: filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const approveMedia = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.execute('UPDATE Media SET status = "approved" WHERE id = ?', [id]);
        res.json({ message: 'Media approved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const rejectMedia = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.execute('UPDATE Media SET status = "rejected" WHERE id = ?', [id]);
        res.json({ message: 'Media rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllMedia,
    getPendingMedia,
    uploadMedia,
    approveMedia,
    rejectMedia
};
