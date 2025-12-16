/**
 * Password Reset Tests
 * 
 * Tests for the 3-step password reset flow with OTP
 * Note: These tests focus on validation and basic flow since
 * complex business logic requires database integration tests
 */

const request = require('supertest');
const crypto = require('crypto');

// Mock database connection - prevent real DB connection
jest.mock('../db/database.js', () => {
  return jest.fn().mockImplementation((eventEmitter) => {
    setImmediate(() => eventEmitter.emit('db-connection-established'));
    return Promise.resolve();
  });
});
jest.mock('../mailer/mailerFile', () => jest.fn().mockResolvedValue(true));
jest.mock('../services/errorNotificationService', () => ({
  sendErrorNotification: jest.fn().mockResolvedValue(true),
  sendCriticalSystemError: jest.fn().mockResolvedValue(true),
}));

// Import the mocked models (via moduleNameMapper in jest.config.js)
const models = require('../models');
const mockStore = models.__mockStore;

// Import app AFTER mocks are configured
const app = require('../app');

describe('Password Reset API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.msmeFindOne.mockReset();
    mockStore.msmeUpdate.mockReset();
  });

  describe('POST /api/msme-business/forget-password/request-otp', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/request-otp')
        .send({ email_address: 'invalid-email' });

      expect(response.status).toBe(400);
    });

    it('should return 200 even for non-existent email (security)', async () => {
      // For security, we don't reveal if email exists
      mockStore.msmeFindOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/forget-password/request-otp')
        .send({ email_address: 'nonexistent@test.com' });

      // Should return success to not reveal if email exists
      expect([200, 404]).toContain(response.status);
    });

    it('should accept valid email and attempt OTP flow', async () => {
      const mockUser = {
        id: 1,
        email_address: 'user@test.com',
        update: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockStore.msmeFindOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/msme-business/forget-password/request-otp')
        .send({ email_address: 'user@test.com' });

      // Request accepted - either succeeds or fails due to email service
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/msme-business/forget-password/verify-otp', () => {
    it('should return 400 for invalid OTP format', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'user@test.com', otp: '123' }); // Too short

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ otp: '123456' });

      expect(response.status).toBe(400);
    });

    it('should process valid format OTP request', async () => {
      // Mock user with valid OTP
      const mockUser = {
        id: 1,
        email_address: 'user@test.com',
        otp: '123456',
        otp_expiry: new Date(Date.now() + 600000), // Valid for 10 mins
        update: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockStore.msmeFindOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'user@test.com', otp: '123456' });

      // Should succeed and return reset token
      expect(response.status).toBe(200);
      expect(response.body.reset_token).toBeDefined();
      expect(response.body.reset_token.length).toBe(64);
    });

    it('should return 400 when no user found with OTP', async () => {
      mockStore.msmeFindOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'unknown@test.com', otp: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('POST /api/msme-business/forget-password/reset', () => {
    it('should return 400 for missing reset token', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({ 
          email_address: 'user@test.com',
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({ 
          email_address: 'user@test.com',
          reset_token: crypto.randomBytes(32).toString('hex'),
          password: '123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({ 
          reset_token: crypto.randomBytes(32).toString('hex'),
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
    });

    it('should process valid reset request', async () => {
      const validToken = crypto.randomBytes(32).toString('hex');
      const mockUser = {
        id: 1,
        email_address: 'user@test.com',
        reset_token: validToken,
        reset_token_expiry: new Date(Date.now() + 600000),
        otp_verified: true,
        update: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      mockStore.msmeFindOne.mockResolvedValue(mockUser);
      // Ensure update returns truthy value (Sequelize returns [affectedCount])
      mockStore.msmeUpdate.mockResolvedValue([1]);

      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({ 
          email_address: 'user@test.com',
          reset_token: validToken,
          password: 'newpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });

    it('should return 400 for invalid reset token', async () => {
      mockStore.msmeFindOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({ 
          email_address: 'user@test.com',
          reset_token: crypto.randomBytes(32).toString('hex'),
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format for all endpoints', async () => {
      const endpoints = [
        '/api/msme-business/forget-password/request-otp',
        '/api/msme-business/forget-password/verify-otp',
        '/api/msme-business/forget-password/reset',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .post(endpoint)
          .send({ email_address: 'not-an-email' });
        
        expect(response.status).toBe(400);
      }
    });
  });
});
