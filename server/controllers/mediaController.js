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
        const { uploaderId, requestedStartTime, requestedEndTime } = req.body; 
        
        let fileType = 'image';
        if (mimetype.includes('pdf')) fileType = 'pdf';
        if (mimetype.includes('video')) fileType = 'video';

        const pool = await poolPromise;
        const start = requestedStartTime ? requestedStartTime.replace('T', ' ') : null;
        const end = requestedEndTime ? requestedEndTime.replace('T', ' ') : null;

        await pool.execute(
            'INSERT INTO Media (fileName, filePath, fileType, uploaderId, status, requestedStartTime, requestedEndTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [filename, filePath, fileType, uploaderId || null, Number(uploaderId) === 1 ? 'approved' : 'pending', start, end]
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
        
        // 1. Mark as approved
        await pool.execute('UPDATE Media SET status = "approved" WHERE id = ?', [id]);
        
        // 2. Fetch requested times
        const [rows] = await pool.execute('SELECT * FROM Media WHERE id = ?', [id]);
        const m = rows[0];
        
        // 3. If user requested a schedule, create it automatically
        if (m && m.requestedStartTime && m.requestedEndTime) {
            const start = m.requestedStartTime.replace('T', ' ');
            const end = m.requestedEndTime.replace('T', ' ');

            await pool.execute(
                'INSERT INTO Schedules (mediaId, startTime, endTime, duration, isActive) VALUES (?, ?, ?, ?, ?)',
                [m.id, start, end, 10, 1]
            );
            
            // Notify all clients to refresh content
            const io = req.app.get('socketio');
            if (io) io.emit('contentUpdate');
        }

        res.json({ message: 'Media approved and scheduled' });
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

const resubmitMedia = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        // Find existing media
        const [rows] = await pool.execute('SELECT * FROM Media WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Media not found' });
        
        const m = rows[0];
        // Create new record with pending status
        await pool.execute(
            'INSERT INTO Media (fileName, filePath, fileType, uploaderId, status) VALUES (?, ?, ?, ?, ?)',
            [m.fileName, m.filePath, m.fileType, m.uploaderId, 'pending']
        );
        
        res.json({ message: 'Media re-submitted for approval' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllMedia,
    getPendingMedia,
    uploadMedia,
    approveMedia,
    rejectMedia,
    resubmitMedia
};
