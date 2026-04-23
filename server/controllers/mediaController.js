const Media = require('../models/Media');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const AuditService = require('../services/auditService');
const fs = require('fs');

const getAllMedia = async (req, res) => {
    try {
        const media = await Media.find({ status: 'approved' }).sort({ uploadedAt: -1 });
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve media library.' });
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
        res.status(500).json({ error: 'Failed to retrieve pending queue.' });
    }
};

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { filename, path: filePath, mimetype, size, originalname } = req.file;
        const { requestedStartTime, requestedEndTime, duration } = req.body; 
        const uploaderId = req.user.id; 
        
        let fileType = 'image';
        if (mimetype.includes('pdf')) fileType = 'pdf';
        if (mimetype.includes('video')) fileType = 'video';

        let status = 'pending';
        const user = await User.findById(uploaderId);
        if (user && user.role === 'admin') {
            status = 'approved'; // Admin auto-approves
        }

        try {
            const newMedia = await Media.create({
                fileName: filename,
                originalName: originalname,
                filePath,
                fileType,
                size,
                duration: duration || 10,
                uploaderId,
                status,
                requestedStartTime: requestedStartTime || null,
                requestedEndTime: requestedEndTime || null
            });

            // 📝 Log to Audit Trail
            await AuditService.log({
                actionType: 'UPLOAD',
                entityType: 'Media',
                entityId: newMedia._id,
                userId: uploaderId,
                newState: newMedia.toJSON()
            });

            res.status(201).json({ message: 'File uploaded successfully', fileName: filename });
        } catch (dbErr) {
            // Delete file if DB fails
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw dbErr;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
};

const approveMedia = async (req, res) => {
    const { id } = req.params;
    const { startTime, endTime } = req.body;
    const adminId = req.user.id;

    try {
        const media = await Media.findById(id);
        if (!media) return res.status(404).json({ message: 'Media not found' });

        const previousState = media.toJSON();
        
        media.status = 'approved';
        if (startTime) media.requestedStartTime = startTime;
        if (endTime) media.requestedEndTime = endTime;
        await media.save();

        // 📝 Log to Audit Trail
        await AuditService.log({
            actionType: 'APPROVE',
            entityType: 'Media',
            entityId: media._id,
            userId: adminId,
            previousState,
            newState: media.toJSON()
        });
        
        const io = req.app.get('socketio');
        if (io) io.emit('contentUpdate');

        res.json({ message: 'Media approved. It is now available in the Broadcast System.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve asset.' });
    }
};

const rejectMedia = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Strict Requirement: Rejecting requires a reason
    if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'A rejection reason is strictly required.' });
    }

    try {
        const media = await Media.findById(id);
        if (!media) return res.status(404).json({ message: 'Media not found' });

        const previousState = media.toJSON();

        media.status = 'rejected';
        media.rejectionReason = reason;
        await media.save();

        // 📝 Log to Audit Trail
        await AuditService.log({
            actionType: 'REJECT',
            entityType: 'Media',
            entityId: media._id,
            userId: adminId,
            previousState,
            newState: media.toJSON(),
            reason: reason
        });

        res.json({ message: 'Media rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject asset.' });
    }
};

const resubmitMedia = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const m = await Media.findById(id);
        if (!m) return res.status(404).json({ message: 'Media not found' });
        
        const previousState = m.toJSON();

        // BUG FIX: Do not duplicate the DB entry pointing to the same file.
        // Instead, reset the existing entry to pending.
        m.status = 'pending';
        m.rejectionReason = undefined;
        await m.save();

        // 📝 Log to Audit Trail
        await AuditService.log({
            actionType: 'RESUBMIT',
            entityType: 'Media',
            entityId: m._id,
            userId: userId,
            previousState,
            newState: m.toJSON()
        });
        
        res.json({ message: 'Media re-submitted for approval' });
    } catch (err) {
        res.status(500).json({ error: 'Re-submission failed.' });
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
