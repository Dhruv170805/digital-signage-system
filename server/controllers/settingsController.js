const Setting = require('../models/Setting');
const Media = require('../models/Media');
const Schedule = require('../models/Schedule');
const fs = require('fs');
const path = require('path');

const getSettings = async (req, res) => {
    try {
        const rows = await Setting.find();
        const settings = {};
        rows.forEach(r => {
            settings[r.key] = r.value;
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve settings.' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await Setting.findOneAndUpdate(
                { key },
                { value },
                { upsert: true, new: true }
            );
        }
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings.' });
    }
};

const wipeSystem = async (req, res) => {
    try {
        // Delete all schedules
        await Schedule.deleteMany({});
        
        // Delete all media records
        await Media.deleteMany({});
        
        // Clear uploads folder (except .gitkeep if exists)
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep') {
                    fs.unlinkSync(path.join(uploadsDir, file));
                }
            }
        }

        const io = req.app.get('socketio');
        if (io) io.emit('scheduleUpdated');

        res.json({ message: 'System purged successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'System purge failed.' });
    }
};

module.exports = { getSettings, updateSettings, wipeSystem };
