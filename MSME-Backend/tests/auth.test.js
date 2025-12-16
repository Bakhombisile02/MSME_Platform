/**
 * Authentication Tests
 * 
 * Tests for admin and user authentication flows
 */

const request = require('supertest');

// Mock the database models before requiring app
jest.mock('../models', () => ({
  AdminModel: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  },
  MSMEBusinessModel: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  },
  DirectorsInfoModel: {
    bulkCreate: jest.fn(),
  },
  BusinessOwnersModel: {
    bulkCreate: jest.fn(),
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
}));

// Mock database connection
jest.mock('../db/database.js', () => {
  return jest.fn().mockImplementation((eventEmitter) => {
    setImmediate(() => {
      eventEmitter.emit('db-connection-established');
    });
    return Promise.resolve();
  });
});

// Mock email service
jest.mock('../mailer/mailerFile', () => jest.fn());

// Mock error notification service
jest.mock('../services/errorNotificationService', () => ({
  sendErrorNotification: jest.fn().mockResolvedValue(true),
  sendCriticalSystemError: jest.fn().mockResolvedValue(true),
}));

const app = require('../app');
const { AdminModel, MSMEBusinessModel } = require('../models');

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/login', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@test.com', password: '' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for non-existent admin', async () => {
      AdminModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 400 for incorrect password', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@test.com',
        password: 'hashed_password',
        name: 'Test Admin',
        user_type: 'admin',
        comparePassword: jest.fn().mockResolvedValue(false),
        generateAuthToken: jest.fn().mockReturnValue('mock_token'),
      };
      AdminModel.findOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(response.status).toBe(400);
      expect(mockAdmin.comparePassword).toHaveBeenCalled();
    });

    it('should return 200 with token for valid credentials', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@test.com',
        password: 'hashed_password',
        name: 'Test Admin',
        user_type: 'admin',
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('valid_token'),
      };
      AdminModel.findOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@test.com', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('valid_token');
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.email).toBe('admin@test.com');
    });
  });

  describe('POST /api/msme-business/login', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/msme-business/login')
        .send({ email_address: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for non-existent user', async () => {
      MSMEBusinessModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/msme-business/login')
        .send({ email_address: 'user@test.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 200 with token for valid credentials', async () => {
      const mockUser = {
        id: 1,
        email_address: 'user@test.com',
        name_of_organization: 'Test Business',
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('user_token'),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          email_address: 'user@test.com',
          name_of_organization: 'Test Business',
        }),
      };
      MSMEBusinessModel.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/msme-business/login')
        .send({ email_address: 'user@test.com', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('user_token');
      expect(response.body.user).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login endpoints', async () => {
      AdminModel.findOne.mockResolvedValue(null);

      // Make multiple requests to trigger rate limit
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/admin/login')
          .send({ email: 'test@test.com', password: 'password' })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});

describe('Protected Routes', () => {
  describe('Admin Registration', () => {
    it('should require authentication for admin registration', async () => {
      const response = await request(app)
        .post('/api/admin/ragister')
        .send({
          email: 'newadmin@test.com',
          password: 'password123',
          name: 'New Admin'
        });

      // Should be 401 (unauthorized) since no token provided
      expect(response.status).toBe(401);
    });
  });

  describe('File Uploads', () => {
    it('should require admin auth for CMS uploads', async () => {
      const response = await request(app)
        .post('/api/upload/partners-logo-image')
        .attach('file', Buffer.from('fake image'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    // Business uploads should work without auth (during registration)
    it('should allow business image upload without auth', async () => {
      const response = await request(app)
        .post('/api/upload/business-image')
        .attach('file', Buffer.from('fake image'), 'test.jpg');

      // Should not be 401 (might be 400 due to invalid file, but not 401)
      expect(response.status).not.toBe(401);
    });
  });
});
