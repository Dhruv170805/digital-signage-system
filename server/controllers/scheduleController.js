const Schedule = require('../models/Schedule');
const Media = require('../models/Media');
const Template = require('../models/Template');
const Screen = require('../models/Screen');

const getActiveSchedule = async (req, res) => {
    const { screenId } = req.query;
    try {
        const now = new Date();
        const query = {
            startTime: { $lte: now },
            endTime: { $gte: now },
            isActive: 1
        };

        if (screenId) {
            query.$or = [{ screenId }, { screenId: null }];
        }

        const schedules = await Schedule.find(query)
            .populate('mediaId')
            .populate('templateId')
            .sort({ startTime: 1 });
            
        // Transform for frontend expected format (layout, filePath, etc)
        const transformed = schedules.map(s => {
            const data = s.toJSON();
            const media = s.mediaId ? s.mediaId.toJSON() : {};
            const template = s.templateId ? s.templateId.toJSON() : {};
            return {
                ...data,
                fileName: media.fileName,
                filePath: media.filePath,
                fileType: media.fileType,
                layout: template.layout
            };
        });

        res.json(transformed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find()
            .populate('mediaId')
            .populate('templateId')
            .populate('screenId')
            .sort({ startTime: -1 });

        const transformed = schedules.map(s => {
            const data = s.toJSON();
            return {
                ...data,
                fileName: s.mediaId ? s.mediaId.fileName : 'N/A',
                fileType: s.mediaId ? s.mediaId.fileType : 'N/A',
                templateName: s.templateId ? s.templateId.name : 'Fullscreen',
                screenName: s.screenId ? s.screenId.name : 'Global Feed'
            };
        });

        res.json(transformed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSchedule = async (req, res) => {
    const { mediaId, templateId, startTime, endTime, duration, screenId, mediaMapping } = req.body;
    try {
        await Schedule.create({
            mediaId: mediaId || null,
            templateId: templateId || null,
            screenId: screenId || null,
            startTime,
            endTime,
            duration: duration || 10,
            mediaMapping: JSON.stringify(mediaMapping || {}),
            isActive: 1
        });
        
        const io = req.app.get('socketio');
        if (io) io.emit('contentUpdate');

        res.status(201).json({ message: 'Schedule created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteSchedule = async (req, res) => {
    const { id } = req.params;
    try {
        await Schedule.findByIdAndDelete(id);
        
        const io = req.app.get('socketio');
        if (io) io.emit('contentUpdate');

        res.json({ message: 'Broadcast terminated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getActiveSchedule,
    getAllSchedules,
    createSchedule,
    deleteSchedule
};
