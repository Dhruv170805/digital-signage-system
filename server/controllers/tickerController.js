const Ticker = require('../models/Ticker');

const getTicker = async (req, res) => {
    try {
        const ticker = await Ticker.findOne().sort({ _id: -1 });
        res.json(ticker || { text: "Welcome to Digital Signage System!", speed: 5 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateTicker = async (req, res) => {
    const { text, speed, type, linkUrl, isActive, fontSize, fontStyle } = req.body;
    try {
        const activeStatus = isActive !== undefined ? isActive : 1;
        
        // Find the latest ticker and update it, or create a new one if none exist
        let ticker = await Ticker.findOne().sort({ _id: -1 });

        if (ticker) {
            await Ticker.findByIdAndUpdate(ticker.id, {
                text, speed, type, linkUrl, isActive: activeStatus, fontSize, fontStyle
            });
        } else {
            await Ticker.create({
                text, speed, type: type || 'text', linkUrl: linkUrl || null, 
                isActive: activeStatus, fontSize: fontSize || 'text-4xl', 
                fontStyle: fontStyle || 'normal'
            });
        }

        // Notify all clients via Socket.IO
        const io = req.app.get('socketio');
        if (io) io.emit('tickerUpdate', { text, speed, type, linkUrl, fontSize, fontStyle });

        res.json({ message: 'Ticker updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getTicker,
    updateTicker
};
