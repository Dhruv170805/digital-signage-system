const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'pending' },
    requestedStartTime: { type: Date },
    requestedEndTime: { type: Date },
    rejectionReason: { type: String },
    uploadedAt: { type: Date, default: Date.now }
});

MediaSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Media', MediaSchema);
