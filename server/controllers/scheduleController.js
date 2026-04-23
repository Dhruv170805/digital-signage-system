const Schedule = require('../models/Schedule');
const Media = require('../models/Media');
const Template = require('../models/Template');
const Screen = require('../models/Screen');
const PlaylistEngine = require('../services/playlistEngine');
const AuditService = require('../services/auditService');

const getActiveSchedule = async (req, res) => {
    const { screenId } = req.query;
    if (!screenId) {
        return res.status(400).json({ error: 'ScreenID is required for active broadcast retrieval.' });
    }
    try {
        const playlist = await PlaylistEngine.getActivePlaylist(screenId);
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve active broadcasts.' });
    }
};

const getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find()
            .populate('mediaId')
            .populate('templateId')
            .sort({ createdAt: -1 });

        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve schedule history.' });
    }
};

const createSchedule = async (req, res) => {
    const { 
        mediaId, 
        templateId, 
        targetType, 
        targetIds, 
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        daysOfWeek, 
        duration, 
        priority,
        mediaMapping 
    } = req.body;
    
    const adminId = req.user.id;

    try {
        const newSchedule = await Schedule.create({
            mediaId: mediaId || null,
            templateId: templateId || null,
            targetType: targetType || 'all',
            targetIds: targetIds || [],
            startDate: startDate || new Date(),
            endDate: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year default
            startTime: startTime || "00:00",
            endTime: endTime || "23:59",
            daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
            duration: duration || 10,
            priority: priority || 10,
            mediaMapping: JSON.stringify(mediaMapping || {}),
            createdBy: adminId,
            isActive: 1,
            status: 'running'
        });
        
        // 📝 Log to Audit Trail
        await AuditService.log({
            actionType: 'SCHEDULE',
            entityType: 'Schedule',
            entityId: newSchedule._id,
            userId: adminId,
            newState: newSchedule.toJSON()
        });

        const io = req.app.get('socketio');
        if (io) io.emit('scheduleUpdated');

        res.status(201).json({ message: 'Broadcast schedule established successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create broadcast schedule.' });
    }
};

const deleteSchedule = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    try {
        const schedule = await Schedule.findById(id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        const previousState = schedule.toJSON();
        await Schedule.findByIdAndDelete(id);
        
        // 📝 Log to Audit Trail
        await AuditService.log({
            actionType: 'TERMINATE',
            entityType: 'Schedule',
            entityId: id,
            userId: adminId,
            previousState
        });

        const io = req.app.get('socketio');
        if (io) io.emit('scheduleUpdated');

        res.json({ message: 'Broadcast terminated and removed from history.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to terminate broadcast.' });
    }
};

const toggleScheduleStatus = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = req.user.id;

    try {
        const schedule = await Schedule.findById(id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        const previousState = schedule.toJSON();
        schedule.isActive = isActive ? 1 : 0;
        schedule.status = isActive ? 'running' : 'paused';
        await schedule.save();

        // 📝 Log to Audit Trail
        await AuditService.log({
            actionType: isActive ? 'RESUME' : 'PAUSE',
            entityType: 'Schedule',
            entityId: id,
            userId: adminId,
            previousState,
            newState: schedule.toJSON()
        });

        const io = req.app.get('socketio');
        if (io) io.emit('scheduleUpdated');

        res.json({ message: `Broadcast ${isActive ? 'resumed' : 'paused'}` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle broadcast status.' });
    }
};

const getPlaylistForMe = async (req, res) => {
    try {
        const playlist = await PlaylistEngine.getPlaylistByToken(req.screen);
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve your broadcast playlist.' });
    }
};

module.exports = {
    getActiveSchedule,
    getAllSchedules,
    createSchedule,
    deleteSchedule,
    toggleScheduleStatus,
    getPlaylistForMe
};
