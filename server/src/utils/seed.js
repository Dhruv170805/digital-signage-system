const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config(); 

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/nexus';
    console.log(`Connecting to ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const adminData = {
      name: 'System Admin',
      email: 'admin@corp.in',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    };

    // Use findOneAndUpdate with upsert to maintain the same document if it exists
    const user = await User.findOneAndUpdate(
      { email: 'admin@corp.in' },
      { $setOnInsert: adminData },
      { upsert: true, new: true }
    );

    console.log(`Admin user ready: ${user.email} (ID: ${user._id})`);

  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
