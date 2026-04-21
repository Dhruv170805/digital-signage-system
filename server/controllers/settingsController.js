const { poolPromise } = require('../config/db');

const getSettings = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute('SELECT * FROM Settings');
        const settings = {};
        rows.forEach(r => {
            settings[r.key] = r.value;
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateSettings = async (req, res) => {
    const { key, value } = req.body;
    try {
        const pool = await poolPromise;
        const [check] = await pool.execute('SELECT COUNT(*) as count FROM Settings WHERE key = ?', [key]);
        
        if (check[0].count > 0) {
            await pool.execute('UPDATE Settings SET value = ? WHERE key = ?', [value, key]);
        } else {
            await pool.execute('INSERT INTO Settings (key, value) VALUES (?, ?)', [key, value]);
        }

        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getSettings, updateSettings };
