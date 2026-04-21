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

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

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
    createUser
};
