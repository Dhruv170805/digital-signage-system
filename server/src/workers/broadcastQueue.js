const { Queue } = require('bullmq');

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const broadcastQueue = new Queue('broadcastQueue', { connection });

module.exports = broadcastQueue;
