const mongoose = require('mongoose');
const Screen = require('../models/Screen');

const setup = async () => {
  const mongoUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/nexus_signage';
  await mongoose.connect(mongoUri);
  
  console.log('🌱 Seeding Chaos Nodes...');
  const nodes = [];
  for (let i = 0; i < 100; i++) {
    nodes.push({
      screenId: `chaos-node-${i}`,
      name: `Chaos Node ${i}`,
      deviceToken: `chaos-node-token-${i}`,
      status: 'offline',
      isActive: true
    });
  }

  await Screen.deleteMany({ screenId: /^chaos-node-/ });
  await Screen.insertMany(nodes);
  console.log('✅ 100 Chaos Nodes Registered.');
  await mongoose.disconnect();
};

setup();
