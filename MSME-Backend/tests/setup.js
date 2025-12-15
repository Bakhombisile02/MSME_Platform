/**
 * Jest Test Setup
 * 
 * Global configuration for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_ADMIN_EXPIRY = '1h';
process.env.JWT_USER_EXPIRY = '1h';

// Mock console.log in tests to reduce noise (comment out for debugging)
// global.console.log = jest.fn();

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});
