require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const Screen = require('../models/Screen');
const IdleConfig = require('../models/IdleConfig');

async function migrate() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB for migration...');

    // 1. Migrate Global Idle Wallpaper
    const globalIdle = await Setting.findOne({ key: 'idleWallpaperId' });
    if (globalIdle) {
      const wallpaperId = JSON.parse(globalIdle.value);
      if (wallpaperId) {
        // Find if already exists
        const exists = await IdleConfig.findOne({ targetType: 'all', 'content.url': { $regex: wallpaperId } });
        if (!exists) {
            console.log('🚀 Migrating global idle wallpaper...');
            await IdleConfig.create({
                name: 'Legacy Global Wallpaper',
                targetType: 'all',
                contentType: 'image',
                content: { url: wallpaperId },
                priority: 10,
                isActive: true
            });
        }
      }
    }

    // 2. Migrate Screen-specific Idle Media
    const screensWithIdle = await Screen.find({ idleMediaId: { $ne: null } }).populate('idleMediaId');
    for (const screen of screensWithIdle) {
        if (screen.idleMediaId) {
            console.log(`🚀 Migrating idle media for screen: ${screen.name}`);
            await IdleConfig.create({
                name: `Legacy Screen Idle: ${screen.name}`,
                targetType: 'screen',
                targetIds: [screen._id.toString()],
                contentType: screen.idleMediaId.mimeType.includes('video') ? 'video' : 'image',
                content: { url: screen.idleMediaId.path },
                priority: 100,
                isActive: true
            });
            // Clear the old field
            screen.idleMediaId = null;
            await screen.save();
        }
    }

    // 3. Remove legacy keys from Settings
    await Setting.deleteMany({ key: { $in: ['idleWallpaperId', 'idleMessage'] } });
    console.log('✅ Legacy settings removed.');

    console.log('🎉 Migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
