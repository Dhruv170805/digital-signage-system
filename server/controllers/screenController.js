const Screen = require('../models/Screen');

const getAllScreens = async (req, res) => {
    try {
        const screens = await Screen.find().sort({ name: 1 });
        res.json(screens);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const registerScreen = async (req, res) => {
    const { name, location } = req.body;
    try {
        const screen = await Screen.create({
            name,
            location: location || 'Unknown',
            status: 'online',
            lastPing: new Date()
        });
        res.status(201).json({ id: screen.id, message: 'Screen registered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateScreenStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await Screen.findByIdAndUpdate(id, { 
            status, 
            lastPing: new Date() 
        });
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
