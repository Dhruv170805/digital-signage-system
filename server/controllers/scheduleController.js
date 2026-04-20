const { poolPromise, sql } = require('../config/db');

const getActiveSchedule = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT S.*, M.fileName, M.filePath, M.fileType, T.layout
                FROM Schedules S
                JOIN Media M ON S.mediaId = M.id
                LEFT JOIN Templates T ON S.templateId = T.id
                WHERE GETDATE() BETWEEN S.startTime AND S.endTime
                AND S.isActive = 1
                ORDER BY S.startTime ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllSchedules = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT S.*, M.fileName, M.fileType, T.name as templateName
                FROM Schedules S
                JOIN Media M ON S.mediaId = M.id
                LEFT JOIN Templates T ON S.templateId = T.id
                ORDER BY S.startTime DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSchedule = async (req, res) => {
    const { mediaId, templateId, startTime, endTime, duration } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('mediaId', sql.Int, mediaId)
            .input('templateId', sql.Int, templateId || null)
            .input('startTime', sql.DateTime, startTime)
            .input('endTime', sql.DateTime, endTime)
            .input('duration', sql.Int, duration)
            .query('INSERT INTO Schedules (mediaId, templateId, startTime, endTime, duration) VALUES (@mediaId, @templateId, @startTime, @endTime, @duration)');
        
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
