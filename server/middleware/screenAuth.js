const Screen = require('../models/Screen');

module.exports = async function screenAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No device token provided" });
    }

    try {
        const screen = await Screen.findOne({ deviceToken: token });

        if (!screen) {
            return res.status(401).json({ error: "Invalid device token" });
        }

        if (!screen.isActive) {
            return res.status(403).json({ error: "Screen is inactive" });
        }

        req.screen = screen;

        // Update last seen
        screen.lastSeen = new Date();
        screen.status = 'online';
        await screen.save();

        next();
    } catch (err) {
        res.status(500).json({ error: "Server error during screen authentication" });
    }
};
