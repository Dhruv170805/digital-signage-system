module.exports = {
  apps: [
    {
      name: 'nexus-api',
      script: './server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'nexus-worker',
      script: './server/src/workers/broadcastWorker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'nexus-client',
      script: 'npm',
      args: 'run preview -- --port 5173 --host',
      cwd: './client',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
