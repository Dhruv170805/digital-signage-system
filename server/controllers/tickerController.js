const Ticker = require('../models/Ticker');
const Screen = require('../models/Screen');

const getAllTickers = async (req, res) => {
    try {
        const tickers = await Ticker.find().sort({ createdAt: -1 });
        res.json(tickers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve tickers.' });
    }
};

const getActiveTickers = async (req, res) => {
    const { screenId } = req.query;
    try {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');

        let groupId = null;
        if (screenId) {
            const screen = await Screen.findById(screenId);
            groupId = screen ? screen.groupId : null;
        }

        // Fetch potentially active tickers
        const query = {
            isActive: 1,
            daysOfWeek: currentDay
        };
        
        // Only enforce date checks if they exist
        const tickers = await Ticker.find(query).lean();

        let validTickers = tickers.filter(t => {
            if (t.startDate && new Date(t.startDate) > now) return false;
            if (t.endDate && new Date(t.endDate) < now) return false;

            const isWithinTime = (currentTime >= t.startTime && currentTime <= t.endTime);
            if (!isWithinTime) return false;

            if (t.targetType === 'global') return true;
            if (t.targetType === 'screen' && t.targetIds.some(id => id.toString() === screenId)) return true;
            if (t.targetType === 'group' && groupId && t.targetIds.some(id => id.toString() === groupId.toString())) return true;

            return false;
        });

        // Priority Sort (Highest wins)
        validTickers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        res.json(validTickers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve active tickers.' });
    }
};

const createTicker = async (req, res) => {
    try {
        const ticker = await Ticker.create(req.body);
        
        const io = req.app.get('socketio');
        if (io) io.emit('tickerUpdate');

        res.status(201).json({ message: 'Ticker created', ticker });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create ticker.' });
    }
};

const updateTicker = async (req, res) => {
    const { id } = req.params;
    try {
        const ticker = await Ticker.findByIdAndUpdate(id, req.body, { new: true });
        
        const io = req.app.get('socketio');
        if (io) io.emit('tickerUpdate');

        res.json({ message: 'Ticker updated', ticker });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update ticker.' });
    }
};

const deleteTicker = async (req, res) => {
    const { id } = req.params;
    try {
        await Ticker.findByIdAndDelete(id);
        
        const io = req.app.get('socketio');
        if (io) io.emit('tickerUpdate');

        res.json({ message: 'Ticker deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete ticker.' });
    }
};

const toggleTickerStatus = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        await Ticker.findByIdAndUpdate(id, { isActive });
        
        const io = req.app.get('socketio');
        if (io) io.emit('tickerUpdate');

        res.json({ message: `Ticker ${isActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle ticker status.' });
    }
};

module.exports = {
    getAllTickers,
    getActiveTickers,
    createTicker,
    updateTicker,
    deleteTicker,
    toggleTickerStatus
};
