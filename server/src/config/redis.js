const Redis = require('ioredis');

// Extract Redis connection details from environment or use defaults
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Primary client for general operations (like caching)
const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('📦 Redis Cache verified.');
});

// A configuration object for BullMQ workers that requires creating its own connection
const redisConnectionOptions = {
  url: redisUrl,
  options: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
};

module.exports = {
  redisClient,
  redisConnectionOptions
};
