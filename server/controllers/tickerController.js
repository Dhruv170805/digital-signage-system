const { poolPromise, sql } = require('../config/db');

const getTicker = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT TOP 1 * FROM Tickers ORDER BY id DESC');
        res.json(result.recordset[0] || { text: "Welcome to Digital Signage System!", speed: 5 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateTicker = async (req, res) => {
    const { text, speed } = req.body;
    try {
        const pool = await poolPromise;
        // Simple logic: if exists update, else insert
        const check = await pool.request().query('SELECT COUNT(*) as count FROM Tickers');
        
        if (check.recordset[0].count > 0) {
            await pool.request()
                .input('text', sql.NVarChar, text)
                .input('speed', sql.Int, speed)
                .query('UPDATE Tickers SET text = @text, speed = @speed');
        } else {
            await pool.request()
                .input('text', sql.NVarChar, text)
                .input('speed', sql.Int, speed)
                .query('INSERT INTO Tickers (text, speed) VALUES (@text, @speed)');
        }

        // Notify all clients via Socket.IO
        const io = req.app.get('socketio');
        io.emit('tickerUpdate', text);

        res.json({ message: 'Ticker updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getTicker,
    updateTicker
};
