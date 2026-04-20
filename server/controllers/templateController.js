const { poolPromise } = require('../config/db');

const getAllTemplates = async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.execute('SELECT * FROM Templates ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createTemplate = async (req, res) => {
    const { name, layout } = req.body;
    try {
        const pool = await poolPromise;
        await pool.execute(
            'INSERT INTO Templates (name, layout) VALUES (?, ?)',
            [name, JSON.stringify(layout)]
        );
        
        res.status(201).json({ message: 'Template created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTemplate = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.execute('DELETE FROM Templates WHERE id = ?', [id]);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTemplates,
    createTemplate,
    deleteTemplate
};
