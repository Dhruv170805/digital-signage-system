const { Worker } = require('bullmq');
const { Emitter } = require('@socket.io/redis-emitter');
const { redisClient } = require('../config/redis');
const Screen = require('../models/Screen');
const assignmentService = require('../services/assignmentService');
const tickerService = require('../services/tickerService');
const configService = require('../services/configService');
const mediaService = require('../services/mediaService');
const idleService = require('../services/idleService');

const ioEmitter = new Emitter(redisClient);

/**
 * 🧠 SCALABLE BROADCAST WORKER (Issue 9 Fix)
 * Optimized to prevent the "Thundering Herd" N+1 query problem.
 */
const broadcastWorker = new Worker('broadcastQueue', async (job) => {
  console.log(`[Worker] Starting Broadcast manifest compilation...`);

  // 1. Pre-aggregate GLOBAL data (once per job, not per screen)
  const [globalTickers, systemSettings, allApprovedMedia] = await Promise.all([
    tickerService.getActive(),
    configService.getFullConfig(),
    mediaService.getAllApproved()
  ]);

  // 2. Fetch all active screens
  const screens = await Screen.find({ isActive: true }).populate('groupId');

  // 3. Process screens in optimized batches
  const batchSize = 100;
  for (let i = 0; i < screens.length; i += batchSize) {
    const batch = screens.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (screen) => {
      // 🧠 STRATEGY: Only fetch screen-specific data that isn't global
      const [playlist, idleConfig] = await Promise.all([
        assignmentService.getActiveAssignmentsForScreen(screen._id, screen.groupId),
        idleService.getIdleContent(screen._id, screen.groupId)
      ]);

      // Emit manifest via Redis Pub/Sub (Fast & Atomic)
      ioEmitter.to(`screen:${screen._id}`).emit('manifestUpdate', {
        screen,
        playlist,
        tickers: globalTickers,
        settings: systemSettings,
        media: allApprovedMedia,
        idleMedia: screen.idleMediaId,
        idleConfig
      });
    }));
    
    console.log(`[Worker] Dispatched manifest to batch ${Math.floor(i/batchSize) + 1}`);
  }

  console.log(`[Worker] Completed broadcast to ${screens.length} total screens`);
}, { 
    connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
});

broadcastWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed critically:`, err);
});

module.exports = broadcastWorker;
