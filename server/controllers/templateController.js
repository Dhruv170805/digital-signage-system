const { poolPromise, sql } = require('../config/db');

const getAllTemplates = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Templates ORDER BY name ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createTemplate = async (req, res) => {
    const { name, layout } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('layout', sql.NVarChar, JSON.stringify(layout))
            .query('INSERT INTO Templates (name, layout) VALUES (@name, @layout)');
        
        res.status(201).json({ message: 'Template created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTemplate = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Templates WHERE id = @id');
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
