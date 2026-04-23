const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    status: { type: String, default: 'active' },
    loginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    passwordResetRequested: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', UserSchema);
