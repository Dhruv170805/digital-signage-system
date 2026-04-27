const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Screen = require('../models/Screen');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('🔍 INSPECTOR AGENT: API Integrity Protocols', () => {
  let deviceToken;
  let adminToken;
  let testScreen;

  beforeAll(async () => {
    // Set environment variables for tests
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-123';
    
    // Connect to test database
    const mongoUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/nexus_signage_test';
    await mongoose.connect(mongoUri);

    // Seed Test Data
    const admin = await User.create({
      name: 'Test Admin',
      email: `test-admin-${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin'
    });

    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'secret');

    testScreen = await Screen.create({
      screenId: `test-screen-${Date.now()}`,
      name: 'Validation Node',
      deviceToken: 'test-integrity-token-12345',
      status: 'online'
    });
    deviceToken = testScreen.deviceToken;
  });

  afterAll(async () => {
    await Screen.deleteMany({ deviceToken: 'test-integrity-token-12345' });
    await User.deleteMany({ email: /@test.com$/ });
    await mongoose.connection.close();
  });

  test('✅ PROTOCOL-001: Public Manifest Resolution', async () => {
    const res = await request(app).get('/api/screens/public-manifest');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('playlist');
    expect(res.body).toHaveProperty('tickers');
  });

  test('✅ PROTOCOL-002: Authenticated Screen Manifest', async () => {
    const res = await request(app)
      .get('/api/screens/manifest')
      .set('Authorization', `Bearer ${deviceToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('playlist');
  });

  test('✅ PROTOCOL-003: Administrative Media Access', async () => {
    const res = await request(app)
      .get('/api/media')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('❌ PROTOCOL-004: Auth Breach Rejection', async () => {
    const res = await request(app)
      .get('/api/media')
      .set('Authorization', `Bearer invalid-token`);
    
    expect(res.statusCode).toEqual(401);
  });
});
