const { poolPromise } = require('../config/db');

const getActiveSchedule = async (req, res) => {
    const { screenId } = req.query;
    try {
        const pool = await poolPromise;
        let query = `
            SELECT S.*, M.fileName, M.filePath, M.fileType, T.layout
            FROM Schedules S
            LEFT JOIN Media M ON S.mediaId = M.id
            LEFT JOIN Templates T ON S.templateId = T.id
            WHERE NOW() BETWEEN S.startTime AND S.endTime
            AND S.isActive = 1
        `;
        const params = [];
        
        if (screenId) {
            query += " AND S.screenId = ?";
            params.push(screenId);
        }

        query += " ORDER BY S.startTime ASC";
        
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllSchedules = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute(`
            SELECT S.*, M.fileName, M.fileType, T.name as templateName, Sc.name as screenName
            FROM Schedules S
            JOIN Media M ON S.mediaId = M.id
            LEFT JOIN Templates T ON S.templateId = T.id
            LEFT JOIN Screens Sc ON S.screenId = Sc.id
            ORDER BY S.startTime DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSchedule = async (req, res) => {
    const { mediaId, templateId, startTime, endTime, duration, screenId, mediaMapping } = req.body;
    try {
        const pool = await poolPromise;
        await pool.execute(
            'INSERT INTO Schedules (mediaId, templateId, startTime, endTime, duration, screenId, mediaMapping) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [mediaId || null, templateId || null, startTime, endTime, duration, screenId || null, JSON.stringify(mediaMapping || {})]
        );
        
        // Notify all clients to refresh content
        const io = req.app.get('socketio');
        io.emit('contentUpdate');

        res.status(201).json({ message: 'Schedule created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getActiveSchedule,
    getAllSchedules,
    createSchedule
};
