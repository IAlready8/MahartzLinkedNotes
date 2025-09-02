// Modern ES Module entry point for Mahart Linked Notes
import '../css/styles.css';

// Core modules
import { Store } from './modules/store.js';
import { Search } from './modules/search.ts';
import { Router } from './modules/router.js';
import { UI } from './modules/ui.js';
import { initUtils } from './modules/util.js';

// Performance monitoring
import { Performance } from './modules/performance.ts';

// Street Style Enhancements
import { initStreetStyle } from './modules/street-style.js';

// Service Worker registration (safe, lazy)
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Defer registration until after page load to avoid blocking
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/src/modules/service-worker.js')
        .then(reg => {
          console.log('Service worker registered:', reg.scope);
        })
        .catch(err => {
          console.warn('Service worker registration failed:', err);
        });
    });
  }
}

// Advanced features (optional) are disabled for build stability.
// If needed, re-enable or migrate them into src/modules/* with proper exports.

class Application {
  constructor() {
    this.modules = new Map();
    this.initialized = false;
    this.initAttempts = 0;
    this.maxAttempts = 20;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      console.log('🚀 Initializing Mahart Linked Notes v2.0...');
      
      // Initialize performance monitoring first
      Performance.init();
      Performance.mark('app-init-start');
      
      // Initialize utilities
      initUtils();
      
      // Register service worker for offline support
      registerServiceWorker();
      
      // Initialize core modules in order
      await this.initializeCore();
      
      // Initialize router
      Router.init();
      
      // Initialize UI last
      await UI.init();
      
      // Initialize Street Style enhancements
      initStreetStyle();
      
      Performance.mark('app-init-end');
      Performance.measure('app-initialization', 'app-init-start', 'app-init-end');
      
      this.initialized = true;
      console.log('✅ Application successfully initialized');
      
      // Notify other tabs about successful initialization
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mahart-notes');
        bc.postMessage({ type: 'app-initialized' });
      }
      
      // Update sync status indicator
      this.updateSyncStatus('ready', 'Application ready');
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.updateSyncStatus('error', 'Initialization failed');
      throw error;
    }
  }

  async initializeCore() {
    // Initialize utilities first
    initUtils();
    
    // Core modules will be initialized by UI.init()
    console.log('Core modules will be initialized by UI...');
  }

  updateSyncStatus(status, message) {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
      const statusColors = {
        ready: 'bg-green-500',
        error: 'bg-red-500',
        loading: 'bg-yellow-500'
      };
      
      syncStatus.className = `w-2 h-2 ${statusColors[status] || 'bg-gray-500'} rounded-full`;
      syncStatus.title = message;
    }
  }

  async retryInit() {
    if (this.initAttempts >= this.maxAttempts) {
      this.showFailureUI();
      return;
    }

    this.initAttempts++;
    const delay = Math.min(this.initAttempts * 100, 1000);
    
    console.log(`Retrying initialization (attempt ${this.initAttempts}) in ${delay}ms...`);
    setTimeout(() => this.init(), delay);
  }

  showFailureUI() {
    document.body.innerHTML = `
      <div class="flex justify-center items-center h-screen bg-gray-900 text-white font-sans">
        <div class="text-center p-8 bg-gray-800 border border-gray-600 rounded-lg max-w-md">
          <h2 class="text-red-400 text-xl mb-4">Initialization Failed</h2>
          <p class="mb-4">Unable to load the application after ${this.maxAttempts} attempts.</p>
          <p class="mb-6 text-sm text-gray-400">Check the console for detailed error messages.</p>
          <button 
            onclick="location.reload()" 
            class="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white hover:bg-gray-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    `;
  }
}

// Initialize application when DOM is ready
const app = new Application();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init().catch(() => app.retryInit()));
} else {
  app.init().catch(() => app.retryInit());
}

// Export for debugging
window.MahartApp = app;
