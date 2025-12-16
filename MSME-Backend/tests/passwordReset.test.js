/**
 * Password Reset Tests
 * 
 * Tests for the password reset flow with OTP verification
 */

const request = require('supertest');

// Mock the database models
jest.mock('../models', () => ({
  AdminModel: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  MSMEBusinessModel: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  },
  DirectorsInfoModel: {},
  BusinessOwnersModel: {},
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
}));

// Mock database connection
jest.mock('../db/database.js', () => {
  return jest.fn().mockImplementation((eventEmitter) => {
    setImmediate(() => eventEmitter.emit('db-connection-established'));
    return Promise.resolve();
  });
});

// Mock services
jest.mock('../mailer/mailerFile', () => jest.fn());
jest.mock('../services/errorNotificationService', () => ({
  sendErrorNotification: jest.fn().mockResolvedValue(true),
  sendCriticalSystemError: jest.fn().mockResolvedValue(true),
}));
jest.mock('../services/BaseRepository', () => ({
  baseUpdate: jest.fn().mockResolvedValue({ id: 1 }),
}));

const app = require('../app');
const { MSMEBusinessModel } = require('../models');
const BaseRepo = require('../services/BaseRepository');

describe('Password Reset API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/msme-business/forget-password/request-otp', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/request-otp')
        .send({ email_address: 'invalid-email' });

      expect(response.status).toBe(400);
    });

    it('should return 200 even for non-existent email (security)', async () => {
      MSMEBusinessModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/forget-password/request-otp')
        .send({ email_address: 'nonexistent@test.com' });

      // Should not reveal if email exists
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If this email exists');
    });

    it('should send OTP for valid email', async () => {
      const mockUser = { id: 1, email_address: 'user@test.com' };
      MSMEBusinessModel.findOne.mockResolvedValue(mockUser);
      BaseRepo.baseUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/msme-business/forget-password/request-otp')
        .send({ email_address: 'user@test.com' });

      expect(response.status).toBe(200);
      expect(BaseRepo.baseUpdate).toHaveBeenCalled();
    });
  });

  describe('POST /api/msme-business/forget-password/verify-otp', () => {
    it('should return 400 for invalid OTP format', async () => {
      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'user@test.com', otp: '123' }); // Too short

      expect(response.status).toBe(400);
    });

    it('should return 400 for wrong OTP', async () => {
      MSMEBusinessModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'user@test.com', otp: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 400 for expired OTP', async () => {
      const expiredDate = new Date(Date.now() - 60000); // 1 minute ago
      MSMEBusinessModel.findOne.mockResolvedValue({
        id: 1,
        email_address: 'user@test.com',
        otp: '123456',
        otp_expiry: expiredDate,
      });

      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'user@test.com', otp: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });

    it('should return reset token for valid OTP', async () => {
      const validExpiry = new Date(Date.now() + 600000); // 10 minutes from now
      MSMEBusinessModel.findOne.mockResolvedValue({
        id: 1,
        email_address: 'user@test.com',
        otp: '123456',
        otp_expiry: validExpiry,
      });
      BaseRepo.baseUpdate.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'user@test.com', otp: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.reset_token).toBeDefined();
      expect(response.body.reset_token.length).toBe(64); // 32 bytes = 64 hex chars
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
          password: 'short',
          reset_token: 'valid_token',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid reset token', async () => {
      MSMEBusinessModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({
          email_address: 'user@test.com',
          password: 'newpassword123',
          reset_token: 'invalid_token',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reset password with valid token', async () => {
      MSMEBusinessModel.findOne.mockResolvedValue({
        id: 1,
        email_address: 'user@test.com',
        reset_token: 'valid_token',
        otp_verified: true,
        reset_token_expiry: new Date(Date.now() + 300000),
      });
      BaseRepo.baseUpdate.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/msme-business/forget-password/reset')
        .send({
          email_address: 'user@test.com',
          password: 'newpassword123',
          reset_token: 'valid_token',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });
  });

  describe('OTP Brute-Force Protection', () => {
    it('should lock out after 5 failed attempts', async () => {
      MSMEBusinessModel.findOne.mockResolvedValue(null);

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/msme-business/forget-password/verify-otp')
          .send({ email_address: 'locked@test.com', otp: '000000' });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/msme-business/forget-password/verify-otp')
        .send({ email_address: 'locked@test.com', otp: '000000' });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Too many failed attempts');
    });
  });
});
