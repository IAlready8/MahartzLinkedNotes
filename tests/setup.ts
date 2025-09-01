// Test setup file for Vitest
import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement;

// Mock crypto API (avoid overwriting read-only in newer Node)
const mockCrypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }
} as any;

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: mockCrypto,
    configurable: true
  });
}

// Mock performance API
global.performance = {
  now: () => Date.now(),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
} as any;

// Mock IndexedDB
class MockIDBRequest {
  result: any = null;
  error: any = null;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  constructor(result?: any) {
    this.result = result;
    setTimeout(() => {
      if (this.onsuccess) {
        this.onsuccess({ target: this });
      }
    }, 0);
  }
}

class MockIDBObjectStore {
  data = new Map();
  
  get(key: string) {
    return new MockIDBRequest(this.data.get(key));
  }
  
  put(value: any, key?: string) {
    if (key) this.data.set(key, value);
    return new MockIDBRequest();
  }
  
  delete(key: string) {
    this.data.delete(key);
    return new MockIDBRequest();
  }
  
  clear() {
    this.data.clear();
    return new MockIDBRequest();
  }
  
  getAllKeys() {
    return new MockIDBRequest(Array.from(this.data.keys()));
  }
}

class MockIDBTransaction {
  objectStore(name: string) {
    return new MockIDBObjectStore();
  }
}

class MockIDBDatabase {
  transaction(storeNames: string[], mode: string = 'readonly') {
    return new MockIDBTransaction();
  }
  
  close() {}
}

// Library mocks are provided via vitest aliases in vitest.config.ts

// Mock BroadcastChannel
global.BroadcastChannel = class {
  channel: string;
  
  constructor(channel: string) {
    this.channel = channel;
  }
  
  postMessage(data: any) {
    // Mock implementation
  }
  
  close() {
    // Mock implementation
  }
  
  addEventListener() {
    // Mock implementation
  }
  
  removeEventListener() {
    // Mock implementation
  }
} as any;

// Mock console for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Add test utilities to global scope
declare global {
  const createMockNote: (overrides?: any) => any;
  const waitFor: (fn: () => boolean | Promise<boolean>, timeout?: number) => Promise<void>;
}

// Utility function to create mock notes
let __noteCounter = 0;
global.createMockNote = (overrides = {}) => ({
  id: `test-note-${Date.now()}-${++__noteCounter}`,
  title: 'Test Note',
  body: 'This is a test note',
  tags: ['#test'],
  links: [],
  color: '#6B7280',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Utility function to wait for conditions
global.waitFor = async (fn: () => boolean | Promise<boolean>, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = await fn();
      if (result) return;
    } catch (error) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};
