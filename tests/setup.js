/* Mahart Linked Notes - Comprehensive Test Setup */

// ============================================================================
// Global Test Environment Setup
// ============================================================================

// Mock browser APIs
import 'jest-environment-jsdom';

// Import testing utilities
import { TextEncoder, TextDecoder } from 'util';
import { performance } from 'perf_hooks';

// ============================================================================
// Global Polyfills & Mocks
// ============================================================================

// Polyfill TextEncoder/TextDecoder for older Node versions
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill performance API
global.performance = performance;

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ============================================================================
// IndexedDB Mock Setup
// ============================================================================

import 'fake-indexeddb/auto';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

global.indexedDB = new FDBFactory();
global.IDBKeyRange = FDBKeyRange;

// ============================================================================
// LocalStorage Mock
// ============================================================================

const localStorageMock = {
  storage: new Map(),
  
  getItem(key) {
    return this.storage.get(key) || null;
  },
  
  setItem(key, value) {
    this.storage.set(key, String(value));
  },
  
  removeItem(key) {
    this.storage.delete(key);
  },
  
  clear() {
    this.storage.clear();
  },
  
  get length() {
    return this.storage.size;
  },
  
  key(index) {
    return Array.from(this.storage.keys())[index] || null;
  }
};

global.localStorage = localStorageMock;
global.sessionStorage = { ...localStorageMock };

// ============================================================================
// DOM Helper Functions
// ============================================================================

global.el = (selector) => document.querySelector(selector);
global.els = (selector) => document.querySelectorAll(selector);

// Create DOM structure for tests
global.setupDOM = () => {
  document.body.innerHTML = `
    <div id="app-container">
      <nav id="main-sidebar"></nav>
      <main id="main-content">
        <div id="page-home" class="page">
          <div id="noteList"></div>
          <textarea id="editor"></textarea>
          <div id="preview"></div>
        </div>
        <div id="page-graph" class="page hidden"></div>
        <div id="page-search" class="page hidden"></div>
        <div id="page-tags" class="page hidden"></div>
      </main>
    </div>
    <div id="toast"></div>
    <div id="modal-container"></div>
  `;
};

// Clean DOM after each test
global.cleanupDOM = () => {
  document.body.innerHTML = '';
};

// ============================================================================
// Application Mocks
// ============================================================================

// Mock the note structure
global.createMockNote = (overrides = {}) => ({
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  title: 'Test Note',
  body: '# Test Note\n\nThis is a test note.',
  tags: ['#test'],
  color: '#6B7280',
  links: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Mock LocalForage
global.mockLocalForage = {
  storage: new Map(),
  
  async getItem(key) {
    return this.storage.get(key) || null;
  },
  
  async setItem(key, value) {
    this.storage.set(key, value);
    return value;
  },
  
  async removeItem(key) {
    this.storage.delete(key);
  },
  
  async clear() {
    this.storage.clear();
  },
  
  async keys() {
    return Array.from(this.storage.keys());
  },
  
  async length() {
    return this.storage.size;
  }
};

// ============================================================================
// Network & API Mocks
// ============================================================================

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    setTimeout(() => this.onopen && this.onopen(), 0);
  }
  
  send(data) {
    // Mock send
  }
  
  close() {
    this.readyState = 3;
    setTimeout(() => this.onclose && this.onclose(), 0);
  }
};

// Mock BroadcastChannel
global.BroadcastChannel = class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }
  
  postMessage(data) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data });
      }
    }, 0);
  }
  
  close() {
    // Mock close
  }
};

// ============================================================================
// Module System Mocks
// ============================================================================

// Mock dynamic imports
global.mockDynamicImport = (moduleName, mockImplementation) => {
  jest.doMock(moduleName, () => mockImplementation, { virtual: true });
};

// Mock CSS imports
jest.mock('*.css', () => ({}), { virtual: true });

// ============================================================================
// Performance & Timing Mocks
// ============================================================================

// Mock performance timing
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();
global.performance.getEntriesByName = jest.fn(() => []);
global.performance.getEntriesByType = jest.fn(() => []);

// Mock console methods for testing
const originalConsole = { ...console };

global.mockConsole = () => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
};

global.restoreConsole = () => {
  Object.assign(console, originalConsole);
};

// ============================================================================
// Test Utilities
// ============================================================================

// Wait for promises to resolve
global.flushPromises = () => new Promise(setImmediate);

// Wait for next tick
global.nextTick = () => new Promise(resolve => process.nextTick(resolve));

// Wait for timeout
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Trigger events
global.triggerEvent = (element, eventType, eventData = {}) => {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
  return event;
};

// ============================================================================
// Before/After Hooks
// ============================================================================

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Reset DOM
  cleanupDOM();
  setupDOM();
  
  // Reset localStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset IndexedDB
  global.indexedDB = new FDBFactory();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Set up mock console
  mockConsole();
});

afterEach(() => {
  // Restore console
  restoreConsole();
  
  // Clean up timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  
  // Clean up DOM
  cleanupDOM();
});

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  const suppressedMethods = ['log', 'info', 'warn'];
  suppressedMethods.forEach(method => {
    const original = console[method];
    console[method] = (...args) => {
      if (process.env.DEBUG_TESTS) {
        original(...args);
      }
    };
  });
});

afterAll(() => {
  // Clean up any global state
  jest.restoreAllMocks();
});

// ============================================================================
// Test Environment Information
// ============================================================================

console.info('🧪 Test Environment Initialized');
console.info(`📍 Node.js version: ${process.version}`);
console.info(`📍 Jest version: ${require('jest/package.json').version}`);
console.info('📍 Available globals:', Object.keys(global).filter(key => 
  ['el', 'els', 'setupDOM', 'cleanupDOM', 'createMockNote', 'mockLocalForage', 'flushPromises', 'nextTick', 'waitFor', 'triggerEvent'].includes(key)
));

// ============================================================================
// Export utilities for use in tests
// ============================================================================

export {
  setupDOM,
  cleanupDOM,
  createMockNote,
  mockLocalForage,
  flushPromises,
  nextTick,
  waitFor,
  triggerEvent,
  mockConsole,
  restoreConsole
};