const { Worker } = require('bullmq');
const { Emitter } = require('@socket.io/redis-emitter');
const { redisClient } = require('../config/redis');

// Use the emitter to broadcast without an attached io server instance
const ioEmitter = new Emitter(redisClient);

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const broadcastWorker = new Worker('broadcastQueue', async (job) => {
  console.log(`[Worker] Processing broadcast job ${job.id}`);
  
  const Screen = require('../models/Screen');
  const tickerService = require('../services/tickerService');
  const configService = require('../services/configService');
  const mediaService = require('../services/mediaService');
  const assignmentService = require('../services/assignmentService');

  const [screens, tickers, settings, media] = await Promise.all([
    Screen.find().populate('groupId'),
    tickerService.getActive(),
    configService.getFullConfig(),
    mediaService.getAllApproved()
  ]);

  for (const screen of screens) {
    const playlist = await assignmentService.getActiveAssignmentsForScreen(screen._id, screen.groupId);
    ioEmitter.to(`screen:${screen._id}`).emit('manifestUpdate', {
      screen,
      playlist,
      tickers,
      settings,
      media
    });
  }

  console.log(`[Worker] Completed broadcast to ${screens.length} screens`);
}, { connection });

broadcastWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

module.exports = broadcastWorker;
