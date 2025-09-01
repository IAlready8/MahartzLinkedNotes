import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', 'tests/**/*.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [
        'src/types/**/*',
        'src/**/*.d.ts',
        'tests/**/*',
        '**/*.config.*',
        '**/node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/modules': resolve(__dirname, './src/modules'),
      // Test-time aliases for packages not installed in CI sandbox
      'localforage': resolve(__dirname, './tests/mocks/localforage.ts'),
      'marked': resolve(__dirname, './tests/mocks/marked.ts'),
      'dompurify': resolve(__dirname, './tests/mocks/dompurify.ts'),
      'ulid': resolve(__dirname, './tests/mocks/ulid.ts')
    }
  },
  define: {
    // Mock global variables for tests
    'window.crypto': {},
    'window.performance': {}
  }
});
