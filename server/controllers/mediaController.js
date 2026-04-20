const { poolPromise, sql } = require('../config/db');

const getAllMedia = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Media ORDER BY uploadedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { filename, path, mimetype } = req.file;
        const fileType = mimetype.includes('pdf') ? 'pdf' : 'image';

        const pool = await poolPromise;
        await pool.request()
            .input('fileName', sql.VarChar, filename)
            .input('filePath', sql.VarChar, path)
            .input('fileType', sql.VarChar, fileType)
            .query('INSERT INTO Media (fileName, filePath, fileType) VALUES (@fileName, @filePath, @fileType)');

        res.status(201).json({ message: 'File uploaded successfully', fileName: filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllMedia,
    uploadMedia
};
