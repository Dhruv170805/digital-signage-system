const { poolPromise } = require('../config/db');

const getAllScreens = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute('SELECT * FROM Screens ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const registerScreen = async (req, res) => {
    const { name, location } = req.body;
    try {
        const pool = await poolPromise;
        const [result] = await pool.execute(
            'INSERT INTO Screens (name, location, status) VALUES (?, ?, ?)',
            [name, location || 'Unknown', 'online']
        );
        res.status(201).json({ id: result.insertId, message: 'Screen registered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateScreenStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const pool = await poolPromise;
        await pool.execute('UPDATE Screens SET status = ?, lastPing = NOW() WHERE id = ?', [status, id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllScreens,
    registerScreen,
    updateScreenStatus
};
