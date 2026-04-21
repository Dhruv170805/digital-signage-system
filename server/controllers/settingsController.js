const Setting = require('../models/Setting');

const getSettings = async (req, res) => {
    try {
        const rows = await Setting.find();
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
        await Setting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getSettings, updateSettings };
