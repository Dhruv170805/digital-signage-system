const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/nexus';
    console.log(`Connecting to ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Cleaning up existing admin accounts...');
    await User.deleteMany({ email: 'admin@corp.in' });

    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@corp.in',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    });

    await adminUser.save();
    console.log(`Admin user created from scratch: ${adminUser.email} (ID: ${adminUser._id})`);

  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
