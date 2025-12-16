/**
 * Authentication Tests
 * 
 * Tests for admin and user authentication flows
 */

const request = require('supertest');

// Mock database connection - prevent real DB connection
jest.mock('../db/database.js', () => {
  return jest.fn().mockImplementation((eventEmitter) => {
    setImmediate(() => eventEmitter.emit('db-connection-established'));
    return Promise.resolve();
  });
});
jest.mock('../mailer/mailerFile', () => jest.fn());
jest.mock('../services/errorNotificationService', () => ({
  sendErrorNotification: jest.fn().mockResolvedValue(true),
  sendCriticalSystemError: jest.fn().mockResolvedValue(true),
}));

// Import the mocked models (via moduleNameMapper in jest.config.js)
const models = require('../models');
const mockStore = models.__mockStore;

// Import app AFTER mocks are configured
const app = require('../app');

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.adminFindOne.mockReset();
    mockStore.msmeFindOne.mockReset();
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
      mockStore.adminFindOne.mockResolvedValue(null);

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
      mockStore.adminFindOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(response.status).toBe(400);
      expect(mockAdmin.comparePassword).toHaveBeenCalledWith('wrongpassword');
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
      mockStore.adminFindOne.mockResolvedValue(mockAdmin);

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
      mockStore.msmeFindOne.mockResolvedValue(null);

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
        password: 'hashed_password',
        business_name: 'Test Business',
        is_verified: 2, // Approved
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('user_token'),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          email_address: 'user@test.com',
          business_name: 'Test Business',
          is_verified: 2,
        }),
      };
      mockStore.msmeFindOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/msme-business/login')
        .send({ email_address: 'user@test.com', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('user_token');
      expect(response.body.user).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should skip rate limits in test environment', async () => {
      mockStore.adminFindOne.mockResolvedValue(null);

      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/admin/login')
            .send({ email: 'test@test.com', password: 'password' })
        );
      }

      const responses = await Promise.all(requests);
      
      // All should return 400 (invalid credentials), not 429 (rate limited)
      const allBadRequest = responses.every(r => r.status === 400);
      expect(allBadRequest).toBe(true);
    });
  });
});

describe('Protected Routes', () => {
  describe('Admin Registration', () => {
    it('should require authentication for admin registration', async () => {
      // Note: Route uses 'ragister' - intentional typo maintained for consistency
      const response = await request(app)
        .post('/api/admin/ragister')
        .send({
          email: 'newadmin@test.com',
          password: 'password123',
          name: 'New Admin'
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('File Uploads', () => {
    it('should require admin auth for CMS uploads', async () => {
      const response = await request(app)
        .post('/api/upload/blog-image')
        .attach('file', Buffer.from('test'), 'test.jpg');

      expect([401, 403]).toContain(response.status);
    });

    it('should allow business image upload without auth', async () => {
      const response = await request(app)
        .post('/api/upload/business-image')
        .attach('file', Buffer.from('test image'), { 
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      // Returns 201 Created for successful uploads
      expect(response.status).toBe(201);
    });
  });
});
;
