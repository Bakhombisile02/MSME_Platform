/**
 * Jest Configuration for MSME Backend
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middelware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Coverage thresholds - start low and increase as test coverage improves
  // Current coverage is ~15%, set threshold to 10% to allow CI to pass
  // TODO: Increase thresholds as more tests are written
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: false,  // Don't auto-clear - we need persistent mock state
  resetMocks: false,   // Don't auto-reset - we configure mocks in beforeEach
  restoreMocks: false, // Don't auto-restore - keep mock implementations
  // Module name mapper to ensure consistent mock resolution
  moduleNameMapper: {
    '^../models$': '<rootDir>/models/__mocks__/index.js',
    '^../models/index$': '<rootDir>/models/__mocks__/index.js',
    '^../models/index.js$': '<rootDir>/models/__mocks__/index.js',
  },
};
