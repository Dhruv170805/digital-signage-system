const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String }
});

SettingSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Setting', SettingSchema);
