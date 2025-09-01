/* Mahart Linked Notes - Comprehensive Jest Configuration */

module.exports = {
  // Basic Configuration
  displayName: 'Mahart Linked Notes Tests',
  testEnvironment: 'jsdom',
  rootDir: '.',
  
  // Test Discovery
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/js/**/*.test.js'
  ],
  
  // Setup Files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/matchers/custom-matchers.js'
  ],
  
  // Module Resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^@css/(.*)$': '<rootDir>/css/$1',
    '^@data/(.*)$': '<rootDir>/data/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform Configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css'
  },
  
  // Transform Ignore Patterns
  transformIgnorePatterns: [
    'node_modules/(?!(localforage|marked|dompurify)/)'
  ],
  
  // Coverage Configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js',
    '!js/**/*.spec.js',
    '!js/vendor/**',
    '!js/lib/**',
    '!node_modules/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],
  
  // Coverage Thresholds (Enterprise Grade)
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './js/store.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './js/router.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test Environment Setup
  testEnvironmentOptions: {
    url: 'http://localhost:8000',
    resources: 'usable',
    runScripts: 'dangerously'
  },
  
  // Global Variables
  globals: {
    IS_TEST_ENVIRONMENT: true,
    MOCK_INDEXEDDB: true,
    MOCK_LOCALSTORAGE: true
  },
  
  // Timing Configuration
  testTimeout: 10000,
  setupTimeout: 5000,
  
  // Reporter Configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-results',
        filename: 'test-report.html',
        expand: true,
        pageTitle: 'Mahart Linked Notes Test Results'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        suiteName: 'Mahart Linked Notes Tests'
      }
    ]
  ],
  
  // Verbose Output
  verbose: true,
  
  // Watch Configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Error Handling
  bail: false,
  errorOnDeprecated: true,
  
  // Module File Extensions
  moduleFileExtensions: [
    'js',
    'json',
    'css',
    'html'
  ],
  
  // Clear Mocks
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  
  // Test Results Processing
  testResultsProcessor: '<rootDir>/tests/processors/results-processor.js',
  
  // Custom Resolver
  resolver: '<rootDir>/tests/utils/jest-resolver.js'
};