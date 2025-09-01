// Enhanced Router module with better error handling and navigation features
import { el, toast } from './util.js';

class RouterEngine {
  constructor() {
    this.pages = new Map();
    this.currentPage = null;
    this.navigationHistory = [];
    this.maxHistorySize = 50;
    this.beforeRouteChange = null;
    this.afterRouteChange = null;
  }

  /**
   * Define a route with enhanced configuration
   * @param {string} path - URL hash path
   * @param {object} pageConfig - Page configuration
   */
  definePage(path, pageConfig) {
    console.log(`Defining route: ${path}`);
    
    if (!pageConfig.pageId) {
      throw new Error(`Page configuration for ${path} must include pageId`);
    }

    const config = {
      ...pageConfig,
      path,
      loaded: false,
      loadTime: null,
      loadCount: 0
    };

    this.pages.set(path, config);
  }

  /**
   * Navigate to a specific route
   * @param {string} path - Target route path
   * @param {object} options - Navigation options
   */
  async navigate(path, options = {}) {
    const { replace = false, silent = false } = options;

    if (!silent && this.beforeRouteChange) {
      const shouldContinue = await this.beforeRouteChange(path, this.currentPage);
      if (shouldContinue === false) return false;
    }

    if (replace) {
      window.history.replaceState({}, '', window.location.pathname + path);
    } else {
      window.location.hash = path;
    }

    return true;
  }

  /**
   * Go back in navigation history
   */
  goBack() {
    if (this.navigationHistory.length > 1) {
      this.navigationHistory.pop(); // Remove current
      const previous = this.navigationHistory[this.navigationHistory.length - 1];
      this.navigate(previous.path, { replace: true, silent: true });
    } else {
      this.navigate('#/', { replace: true });
    }
  }

  /**
   * Hide all page elements
   */
  hideAllPages() {
    for (const [path, config] of this.pages) {
      const element = el(`#${config.pageId}`);
      if (element) {
        element.classList.add('hidden');
        element.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * Handle route changes with enhanced error handling
   */
  async handleRouteChange() {
    const path = window.location.hash || '#/';
    console.log(`Navigating to: ${path}`);

    const startTime = performance.now();
    
    try {
      const pageConfig = this.pages.get(path);

      if (!pageConfig) {
        console.warn(`No route found for: ${path}`);
        toast(`Page not found: ${path}`, 'error');
        this.navigate('#/', { replace: true });
        return;
      }

      // Check if page element exists
      const pageElement = el(`#${pageConfig.pageId}`);
      if (!pageElement) {
        console.error(`Page element not found: ${pageConfig.pageId}`);
        toast(`Page element missing: ${pageConfig.pageId}`, 'error');
        return;
      }

      // Hide all pages first
      this.hideAllPages();

      // Show target page
      pageElement.classList.remove('hidden');
      pageElement.setAttribute('aria-hidden', 'false');

      // Update navigation history
      if (!this.navigationHistory.length || this.navigationHistory[this.navigationHistory.length - 1].path !== path) {
        this.navigationHistory.push({
          path,
          timestamp: Date.now(),
          title: pageConfig.title || path
        });

        // Limit history size
        if (this.navigationHistory.length > this.maxHistorySize) {
          this.navigationHistory.shift();
        }
      }

      // Initialize page if needed
      if (pageConfig.onLoad && !pageConfig.loaded) {
        console.log(`Initializing page: ${pageConfig.pageId}`);
        
        try {
          await pageConfig.onLoad();
          pageConfig.loaded = true;
          pageConfig.loadTime = performance.now() - startTime;
          pageConfig.loadCount++;
          
          console.log(`Page ${pageConfig.pageId} loaded in ${Math.round(pageConfig.loadTime)}ms`);
          
        } catch (error) {
          console.error(`Failed to load page ${pageConfig.pageId}:`, error);
          toast(`Failed to load ${pageConfig.pageId}`, 'error');
          
          // Show error state
          pageElement.innerHTML = this.createErrorState(pageConfig.pageId, error);
        }
      }

      // Update current page reference
      this.currentPage = pageConfig;

      // Update document title
      if (pageConfig.title) {
        document.title = `${pageConfig.title} - Mahart Linked Notes`;
      }

      // Update active navigation indicators
      this.updateNavigationState(path);

      // Call after route change hook
      if (this.afterRouteChange) {
        await this.afterRouteChange(path, pageConfig);
      }

    } catch (error) {
      console.error('Route change error:', error);
      toast('Navigation error occurred', 'error');
    }
  }

  /**
   * Update navigation UI state
   */
  updateNavigationState(activePath) {
    // Update sidebar navigation
    const navLinks = document.querySelectorAll('[data-route]');
    navLinks.forEach(link => {
      const linkPath = link.dataset.route;
      if (linkPath === activePath) {
        link.classList.add('active', 'bg-blue-600', 'text-white');
        link.classList.remove('text-gray-300', 'hover:text-white');
      } else {
        link.classList.remove('active', 'bg-blue-600', 'text-white');
        link.classList.add('text-gray-300', 'hover:text-white');
      }
    });
  }

  /**
   * Create error state HTML
   */
  createErrorState(pageId, error) {
    return `
      <div class="flex items-center justify-center h-64">
        <div class="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <div class="text-red-600 text-xl mb-2">⚠️</div>
          <h3 class="text-lg font-semibold text-red-800 mb-2">Page Load Error</h3>
          <p class="text-red-600 mb-4">Failed to initialize ${pageId}</p>
          <p class="text-sm text-red-500 mb-4">${error.message}</p>
          <button 
            onclick="Router.retry('${pageId}')" 
            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Retry loading a failed page
   */
  async retry(pageId) {
    const config = Array.from(this.pages.values()).find(p => p.pageId === pageId);
    if (config) {
      config.loaded = false;
      await this.handleRouteChange();
    }
  }

  /**
   * Get routing statistics
   */
  getStats() {
    const loadedPages = Array.from(this.pages.values()).filter(p => p.loaded);
    const totalLoadTime = loadedPages.reduce((sum, p) => sum + (p.loadTime || 0), 0);

    return {
      totalPages: this.pages.size,
      loadedPages: loadedPages.length,
      currentPage: this.currentPage?.path || null,
      totalLoadTime: Math.round(totalLoadTime),
      navigationHistory: this.navigationHistory.slice(-10),
      pageStats: Array.from(this.pages.entries()).map(([path, config]) => ({
        path,
        pageId: config.pageId,
        loaded: config.loaded,
        loadTime: config.loadTime,
        loadCount: config.loadCount
      }))
    };
  }

  /**
   * Set route change hooks
   */
  setHooks(beforeRouteChange, afterRouteChange) {
    this.beforeRouteChange = beforeRouteChange;
    this.afterRouteChange = afterRouteChange;
  }

  /**
   * Initialize the router
   */
  init() {
    console.log('🚀 Initializing Enhanced Router...');
    
    // Set up event listeners
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('popstate', () => this.handleRouteChange());

    // Handle direct navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const targetRoute = link.dataset.route;
        this.navigate(targetRoute);
      }
    });

    // Set default route if none specified
    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    // Handle initial route
    this.handleRouteChange();

    // Set up keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        this.goBack();
      }
    });

    console.log('✅ Router initialized successfully');
  }

  /**
   * Register common page routes
   */
  registerDefaultPages() {
    // Register pages that should always be available
    const defaultPages = [
      { path: '#/', pageId: 'page-editor', title: 'Editor' },
      { path: '#/graph', pageId: 'page-graph', title: 'Knowledge Graph' },
      { path: '#/tags', pageId: 'page-tags', title: 'Tag Management' },
      { path: '#/ai', pageId: 'page-ai', title: 'AI Assistant' },
      { path: '#/settings', pageId: 'page-settings', title: 'Settings' }
    ];

    defaultPages.forEach(({ path, pageId, title }) => {
      if (!this.pages.has(path)) {
        this.definePage(path, { pageId, title });
      }
    });
  }
}

// Create and export router instance
const router = new RouterEngine();

export const Router = {
  init: () => router.init(),
  definePage: (path, config) => router.definePage(path, config),
  navigate: (path, options) => router.navigate(path, options),
  goBack: () => router.goBack(),
  handleRouteChange: () => router.handleRouteChange(),
  hideAllPages: () => router.hideAllPages(),
  retry: (pageId) => router.retry(pageId),
  getStats: () => router.getStats(),
  setHooks: (before, after) => router.setHooks(before, after),
  registerDefaultPages: () => router.registerDefaultPages(),
  get pages() { return router.pages; },
  get currentPage() { return router.currentPage; },
  get navigationHistory() { return router.navigationHistory; }
};

// Make router globally available for debugging and external use
if (typeof window !== 'undefined') {
  window.Router = Router;
}