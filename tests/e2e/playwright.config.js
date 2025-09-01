/* Mahart Linked Notes - Playwright E2E Configuration */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Global test timeout
  timeout: 30000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8000',
    
    // Browser settings
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Context options
    contextOptions: {
      // Simulate real user behavior
      reducedMotion: 'reduce',
      colorScheme: 'dark',
      
      // Enable permissions for clipboard, notifications, etc.
      permissions: ['clipboard-read', 'clipboard-write'],
      
      // Storage state
      storageState: 'tests/e2e/fixtures/storage-state.json'
    }
  },

  // Test projects for different browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] }
    },
    
    // Edge cases
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--simulate-slow-connection']
        }
      }
    },
    
    // High DPI
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2
      }
    }
  ],

  // Local development server
  webServer: process.env.CI ? undefined : {
    command: 'python3 -m http.server 8000',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    cwd: '.',
    timeout: 10000
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),

  // Test output
  outputDir: 'test-results/e2e-artifacts',

  // Expect configuration
  expect: {
    // Screenshot comparisons
    threshold: 0.2,
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'strict'
    },
    toMatchSnapshot: {
      threshold: 0.2
    }
  },

  // Metadata
  metadata: {
    'Test Type': 'End-to-End',
    'Application': 'Mahart Linked Notes',
    'Environment': process.env.NODE_ENV || 'development'
  }
});