const Screen = require('../models/Screen');
const crypto = require('crypto');

const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const getAllScreens = async (req, res) => {
    try {
        const screens = await Screen.find().sort({ createdAt: -1 });
        res.json(screens);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve screen monitoring data.' });
    }
};

const registerScreen = async (req, res) => {
    const { name, location, groupName, screenId } = req.body;
    try {
        // Auto-generate screenId if not provided (e.g., screen-N)
        let finalScreenId = screenId;
        if (!finalScreenId) {
            const count = await Screen.countDocuments();
            finalScreenId = `screen-${count + 1}`;
        }

        const deviceToken = generateToken();

        const screen = await Screen.create({
            screenId: finalScreenId,
            name,
            location: location || 'Unknown',
            groupName: groupName || 'Default',
            deviceToken,
            status: 'online',
            lastSeen: new Date()
        });
        
        const io = req.app.get('socketio');
        if (io) io.emit('screenUpdate');

        res.status(201).json({ 
            screenId: screen.screenId,
            deviceToken: screen.deviceToken,
            displayUrl: `/display?token=${screen.deviceToken}`,
            message: 'Screen registered successfully'
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Screen ID already exists.' });
        }
        res.status(500).json({ error: 'Failed to register screen.' });
    }
};

const getMe = async (req, res) => {
    res.json({
        id: req.screen.id,
        screenId: req.screen.screenId,
        name: req.screen.name,
        group: req.screen.groupName,
        location: req.screen.location,
        status: "online",
        lastSeen: req.screen.lastSeen
    });
};

const resetToken = async (req, res) => {
    const { id } = req.params;
    try {
        const newToken = generateToken();
        const screen = await Screen.findByIdAndUpdate(id, { 
            deviceToken: newToken 
        }, { new: true });

        if (!screen) return res.status(404).json({ error: "Screen not found" });

        res.json({ 
            deviceToken: newToken, 
            displayUrl: `/display?token=${newToken}`,
            message: "Token reset successfully" 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset token" });
    }
};

const updateScreen = async (req, res) => {
    const { id } = req.params;
    try {
        const screen = await Screen.findByIdAndUpdate(id, req.body, { new: true });
        
        const io = req.app.get('socketio');
        if (io) io.emit('screenUpdate');

        res.json(screen);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update screen.' });
    }
};

module.exports = {
    getAllScreens,
    registerScreen,
    getMe,
    resetToken,
    updateScreen
};
