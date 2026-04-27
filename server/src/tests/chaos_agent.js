const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5006';
const CONNECTIONS = 100; // Simulating 100 concurrent nodes
const TEST_DURATION = 10000; // 10 seconds

console.log(`🌪️ CHAOS AGENT: Initiating Load Stress Test [Target: ${CONNECTIONS} nodes]`);

const sockets = [];
let connectedCount = 0;
let manifestUpdates = 0;

const spawnNode = (id) => {
  const socket = io(SOCKET_URL, {
    auth: { deviceToken: `chaos-node-token-${id}` },
    transports: ['websocket'],
    reconnection: false
  });

  socket.on('connect', () => {
    connectedCount++;
    // Simulate heartbeat
    socket.emit('screenPing', { 
        token: `chaos-node-token-${id}`, 
        telemetry: { uptime: id, temp: 40 + (id % 10) } 
    });
  });

  socket.on('manifestUpdate', () => {
    manifestUpdates++;
  });

  socket.on('connect_error', (err) => {
    // console.error(`Node ${id} failed:`, err.message);
  });

  sockets.push(socket);
};

for (let i = 0; i < CONNECTIONS; i++) {
  spawnNode(i);
}

setTimeout(() => {
  console.log(`📊 CHAOS REPORT:`);
  console.log(`   - Target Nodes: ${CONNECTIONS}`);
  console.log(`   - Successful Handshakes: ${connectedCount}`);
  console.log(`   - Manifest Sync Events: ${manifestUpdates}`);
  
  const healthRatio = connectedCount / CONNECTIONS;
  if (healthRatio > 0.95) {
    console.log(`✅ VERDICT: System stability within God-Level parameters (${(healthRatio * 100).toFixed(1)}%)`);
  } else {
    console.log(`❌ VERDICT: Stability breach detected. Health ratio: ${(healthRatio * 100).toFixed(1)}%`);
  }

  sockets.forEach(s => s.disconnect());
  process.exit(healthRatio > 0.95 ? 0 : 1);
}, TEST_DURATION);
