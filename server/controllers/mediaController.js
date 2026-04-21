const Media = require('../models/Media');
const Schedule = require('../models/Schedule');
const User = require('../models/User');

const getAllMedia = async (req, res) => {
    try {
        const media = await Media.find({ status: 'approved' }).sort({ uploadedAt: -1 });
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPendingMedia = async (req, res) => {
    try {
        const media = await Media.find({ status: 'pending' })
            .populate('uploaderId', 'name')
            .sort({ uploadedAt: -1 });
        
        const transformed = media.map(m => ({
            ...m.toJSON(),
            uploaderName: m.uploaderId ? m.uploaderId.name : 'Unknown'
        }));
        
        res.json(transformed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { filename, path: filePath, mimetype } = req.file;
        const { uploaderId, requestedStartTime, requestedEndTime } = req.body; 
        
        let fileType = 'image';
        if (mimetype.includes('pdf')) fileType = 'pdf';
        if (mimetype.includes('video')) fileType = 'video';

        // Check user role for auto-approval
        let status = 'pending';
        if (uploaderId) {
            const user = await User.findById(uploaderId);
            if (user && user.role === 'admin') {
                status = 'approved';
            }
        }

        await Media.create({
            fileName: filename,
            filePath,
            fileType,
            uploaderId: uploaderId || null,
            status,
            requestedStartTime: requestedStartTime || null,
            requestedEndTime: requestedEndTime || null
        });

        res.status(201).json({ message: 'File uploaded successfully', fileName: filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const approveMedia = async (req, res) => {
    const { id } = req.params;
    try {
        const m = await Media.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
        
        if (m && m.requestedStartTime && m.requestedEndTime) {
            await Schedule.create({
                mediaId: m.id,
                startTime: m.requestedStartTime,
                endTime: m.requestedEndTime,
                duration: 10,
                isActive: 1
            });
            
            const io = req.app.get('socketio');
            if (io) io.emit('contentUpdate');
        }

        res.json({ message: 'Media approved and scheduled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const rejectMedia = async (req, res) => {
    const { id } = req.params;
    try {
        await Media.findByIdAndUpdate(id, { status: 'rejected' });
        res.json({ message: 'Media rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const resubmitMedia = async (req, res) => {
    const { id } = req.params;
    try {
        const m = await Media.findById(id);
        if (!m) return res.status(404).json({ message: 'Media not found' });
        
        await Media.create({
            fileName: m.fileName,
            filePath: m.filePath,
            fileType: m.fileType,
            uploaderId: m.uploaderId,
            status: 'pending'
        });
        
        res.json({ message: 'Media re-submitted for approval' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllMedia,
    getPendingMedia,
    uploadMedia,
    approveMedia,
    rejectMedia,
    resubmitMedia
};
