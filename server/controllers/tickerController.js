const { poolPromise } = require('../config/db');

const getTicker = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute('SELECT * FROM Tickers ORDER BY id DESC LIMIT 1');
        res.json(rows[0] || { text: "Welcome to Digital Signage System!", speed: 5 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateTicker = async (req, res) => {
    const { text, speed, type, linkUrl, isActive } = req.body;
    try {
        const pool = await poolPromise;
        // Simple logic: if exists update, else insert
        const [check] = await pool.execute('SELECT COUNT(*) as count FROM Tickers');
        
        const hasRows = check && check.length > 0 && check[0].count > 0;
        const activeStatus = isActive !== undefined ? isActive : 1;

        if (hasRows) {
            await pool.execute(
                'UPDATE Tickers SET text = ?, speed = ?, type = ?, linkUrl = ?, isActive = ?',
                [text, speed, type || 'text', linkUrl || null, activeStatus]
            );
        } else {
            await pool.execute(
                'INSERT INTO Tickers (text, speed, type, linkUrl, isActive) VALUES (?, ?, ?, ?, ?)',
                [text, speed, type || 'text', linkUrl || null, activeStatus]
            );
        }

        // Notify all clients via Socket.IO
        const io = req.app.get('socketio');
        io.emit('tickerUpdate', { text, speed, type, linkUrl });

        res.json({ message: 'Ticker updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getTicker,
    updateTicker
};
