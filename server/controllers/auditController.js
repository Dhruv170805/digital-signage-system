const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
    try {
        const { userId, actionType, entityType, startDate, endDate } = req.query;

        // Build filter
        let query = {};
        if (userId) query.userId = userId;
        if (actionType) query.actionType = actionType;
        if (entityType) query.entityType = entityType;
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .populate('screenId', 'name location')
            .sort({ timestamp: -1 })
            .limit(100); // Pagination could be added later

        res.json(logs);
    } catch (err) {
        console.error('AuditLog fetch error:', err);
        res.status(500).json({ error: 'Failed to retrieve audit history.' });
    }
};

module.exports = {
    getAuditLogs
};
