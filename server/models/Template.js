const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    layout: { type: String } // Stored as JSON string to maintain compatibility or Mixed object
});

TemplateSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Template', TemplateSchema);
