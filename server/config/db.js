const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
    try {
        console.log('💎 NEXUS CORE: Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ NEXUS CORE: MongoDB Connected.');

        // Seeding initial admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@corp.in';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            console.log('👤 Provisioning Root Admin...');
            const salt = await bcrypt.genSalt(10);
            const adminHash = await bcrypt.hash(adminPassword, salt);
            
            await User.create({
                name: 'Root Admin',
                email: adminEmail,
                password: adminHash,
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Root Admin provisioned.');
        }
    } catch (err) {
        console.error('❌ NEXUS CORE: MongoDB Connection Error ->', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
