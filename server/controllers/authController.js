const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'Account is deactivated. Contact Admin.' });
        }

        if (user.isLocked) {
            return res.status(403).json({ message: 'Account is locked due to multiple failed attempts. Contact Admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 3) {
                user.isLocked = true;
                await user.save();
                return res.status(403).json({ message: 'Account locked after 3 failed attempts.' });
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Success: reset attempts
        user.loginAttempts = 0;
        await user.save();

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'inactive'
    try {
        await User.findByIdAndUpdate(id, { status });
        res.json({ message: `User status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const unlockUser = async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndUpdate(id, { isLocked: false, loginAttempts: 0 });
        res.json({ message: 'User account unlocked' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.passwordResetRequested = true;
        await user.save();
        res.json({ message: 'Reset request sent to administrator' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const approveResetRequest = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(id, { 
            password: hashedPassword, 
            passwordResetRequested: false,
            isLocked: false,
            loginAttempts: 0
        });
        res.json({ message: 'Password reset and account unlocked' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            status: 'active'
        });
        
        res.status(201).json({ message: 'User provisioned successfully' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    login,
    getAllUsers,
    toggleUserStatus,
    unlockUser,
    requestPasswordReset,
    approveResetRequest,
    createUser
};
