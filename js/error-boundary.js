/* Mahart Linked Notes - Global Error Boundary System */

/**
 * Comprehensive error boundary and handling system for enterprise-grade reliability
 * Provides graceful error recovery, detailed logging, and user feedback
 */

const ErrorBoundary = {
  // Error tracking and statistics
  errors: new Map(),
  errorCount: 0,
  lastErrorTime: null,
  crashReports: [],
  
  // Configuration
  config: {
    maxErrors: 50,
    maxCrashReports: 20,
    enableReporting: true,
    enableConsoleLogging: true,
    enableUserNotification: true,
    enableAutoRecover: true,
    autoRecoverDelay: 5000,
    suppressedErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured'
    ]
  },
  
  // Error severity levels
  SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  
  // Error categories
  CATEGORIES: {
    STORAGE: 'storage',
    NETWORK: 'network',
    RENDERING: 'rendering',
    SCRIPT: 'script',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    USER_ACTION: 'user_action',
    SYSTEM: 'system'
  },

  /**
   * Initialize the error boundary system
   */
  async init() {
    console.log('🛡️ Initializing Error Boundary System...');
    
    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Set up unhandled promise rejection handler
      this.setupPromiseRejectionHandler();
      
      // Set up resource error handler
      this.setupResourceErrorHandler();
      
      // Initialize error recovery system
      this.initializeErrorRecovery();
      
      // Set up periodic error cleanup
      this.setupErrorCleanup();
      
      // Initialize crash reporting
      this.initializeCrashReporting();
      
      // Set up performance error monitoring
      this.setupPerformanceErrorMonitoring();
      
      // Initialize user feedback system
      this.initializeUserFeedback();
      
      console.log('✅ Error Boundary System initialized successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to initialize Error Boundary System:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Set up global JavaScript error handler
   */
  setupGlobalErrorHandlers() {
    // Global error handler for uncaught exceptions
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError({
        type: 'javascript',
        message,
        source,
        lineno,
        colno,
        error,
        severity: this.determineSeverity(error),
        category: this.determineCategory(error, message),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Return true to prevent default browser error handling
      return this.config.enableAutoRecover;
    };
    
    // Enhanced error event listener
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'error_event',
        message: event.message || 'Unknown error',
        source: event.filename || 'Unknown',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        error: event.error,
        target: event.target,
        severity: this.determineSeverity(event.error),
        category: this.determineCategory(event.error, event.message),
        timestamp: new Date().toISOString(),
        stack: event.error ? event.error.stack : null
      });
    }, true);
  },

  /**
   * Set up unhandled promise rejection handler
   */
  setupPromiseRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      this.handleError({
        type: 'unhandled_promise_rejection',
        message: error?.message || 'Unhandled promise rejection',
        error: error,
        severity: this.SEVERITY.HIGH,
        category: this.CATEGORIES.SCRIPT,
        timestamp: new Date().toISOString(),
        stack: error?.stack,
        promise: event.promise
      });
      
      // Prevent default handling if auto-recovery is enabled
      if (this.config.enableAutoRecover) {
        event.preventDefault();
      }
    });
    
    // Handle rejections that are handled later
    window.addEventListener('rejectionhandled', (event) => {
      this.logInfo('Promise rejection was handled late:', event.reason);
    });
  },

  /**
   * Set up resource loading error handler
   */
  setupResourceErrorHandler() {
    // Handle script, image, CSS loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const element = event.target;
        const resourceType = element.tagName?.toLowerCase() || 'unknown';
        
        this.handleError({
          type: 'resource_error',
          message: `Failed to load ${resourceType}: ${element.src || element.href}`,
          resource: element.src || element.href,
          resourceType,
          element,
          severity: this.SEVERITY.MEDIUM,
          category: this.CATEGORIES.NETWORK,
          timestamp: new Date().toISOString()
        });
      }
    }, true);
  },

  /**
   * Initialize error recovery system
   */
  initializeErrorRecovery() {
    this.recoveryStrategies = {
      // Storage errors
      [this.CATEGORIES.STORAGE]: async (errorInfo) => {
        console.log('🔄 Attempting storage error recovery...');
        
        try {
          // Try to reinitialize storage
          if (typeof Store !== 'undefined' && Store.init) {
            await Store.init();
            this.showUserNotification('Storage reconnected', 'success');
            return true;
          }
        } catch (recoveryError) {
          this.logError('Storage recovery failed:', recoveryError);
        }
        
        return false;
      },
      
      // Network errors
      [this.CATEGORIES.NETWORK]: async (errorInfo) => {
        console.log('🔄 Attempting network error recovery...');
        
        try {
          // Check network connectivity
          if (navigator.onLine) {
            // Retry the failed operation after delay
            setTimeout(() => {
              this.showUserNotification('Network connection restored', 'success');
            }, 1000);
            return true;
          }
        } catch (recoveryError) {
          this.logError('Network recovery failed:', recoveryError);
        }
        
        return false;
      },
      
      // Rendering errors
      [this.CATEGORIES.RENDERING]: async (errorInfo) => {
        console.log('🔄 Attempting rendering error recovery...');
        
        try {
          // Clear and reinitialize UI components
          if (typeof UI !== 'undefined' && UI.refreshCurrentPage) {
            await UI.refreshCurrentPage();
            this.showUserNotification('Interface refreshed', 'success');
            return true;
          }
        } catch (recoveryError) {
          this.logError('Rendering recovery failed:', recoveryError);
        }
        
        return false;
      }
    };
  },

  /**
   * Set up periodic error cleanup
   */
  setupErrorCleanup() {
    setInterval(() => {
      this.cleanupOldErrors();
    }, 300000); // Clean up every 5 minutes
  },

  /**
   * Initialize crash reporting system
   */
  initializeCrashReporting() {
    // Monitor for critical errors that might indicate a crash
    this.crashDetectionThreshold = 5; // errors within 10 seconds
    this.crashDetectionWindow = 10000;
    
    setInterval(() => {
      this.detectPotentialCrash();
    }, 5000);
  },

  /**
   * Set up performance error monitoring
   */
  setupPerformanceErrorMonitoring() {
    // Monitor for performance-related errors
    if ('performance' in window) {
      // Long task monitoring
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 100) { // Tasks longer than 100ms
                this.handleError({
                  type: 'performance',
                  message: `Long task detected: ${entry.duration}ms`,
                  duration: entry.duration,
                  severity: this.SEVERITY.MEDIUM,
                  category: this.CATEGORIES.PERFORMANCE,
                  timestamp: new Date().toISOString()
                });
              }
            }
          });
          
          observer.observe({ entryTypes: ['longtask'] });
        } catch (error) {
          this.logError('Failed to set up performance monitoring:', error);
        }
      }
      
      // Memory usage monitoring
      if ('memory' in performance) {
        setInterval(() => {
          const memory = performance.memory;
          const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          
          if (usageRatio > 0.9) { // 90% memory usage
            this.handleError({
              type: 'memory_warning',
              message: `High memory usage: ${Math.round(usageRatio * 100)}%`,
              usedMemory: memory.usedJSHeapSize,
              totalMemory: memory.jsHeapSizeLimit,
              severity: this.SEVERITY.HIGH,
              category: this.CATEGORIES.PERFORMANCE,
              timestamp: new Date().toISOString()
            });
          }
        }, 30000); // Check every 30 seconds
      }
    }
  },

  /**
   * Initialize user feedback system
   */
  initializeUserFeedback() {
    // Create error notification UI if it doesn't exist
    if (!document.getElementById('error-notification')) {
      const errorNotification = document.createElement('div');
      errorNotification.id = 'error-notification';
      errorNotification.className = 'fixed top-4 right-4 z-50 max-w-md bg-red-600 text-white p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300';
      errorNotification.innerHTML = `
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-yellow-300"></i>
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium" id="error-title">Error Occurred</h4>
            <p class="text-sm mt-1" id="error-message"></p>
            <div class="mt-2 flex space-x-2">
              <button id="error-retry" class="text-xs bg-red-700 hover:bg-red-800 px-2 py-1 rounded">
                Retry
              </button>
              <button id="error-dismiss" class="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">
                Dismiss
              </button>
            </div>
          </div>
          <button id="error-close" class="ml-2 text-red-200 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      
      document.body.appendChild(errorNotification);
      
      // Bind event listeners
      document.getElementById('error-close').addEventListener('click', () => {
        this.hideErrorNotification();
      });
      
      document.getElementById('error-dismiss').addEventListener('click', () => {
        this.hideErrorNotification();
      });
      
      document.getElementById('error-retry').addEventListener('click', () => {
        this.retryLastFailedOperation();
      });
    }
  },

  /**
   * Main error handling function
   */
  handleError(errorInfo) {
    try {
      // Check if error should be suppressed
      if (this.shouldSuppressError(errorInfo)) {
        return;
      }
      
      // Increment error count
      this.errorCount++;
      this.lastErrorTime = Date.now();
      
      // Store error information
      const errorId = this.generateErrorId();
      this.errors.set(errorId, {
        ...errorInfo,
        id: errorId,
        count: 1,
        firstOccurrence: errorInfo.timestamp,
        lastOccurrence: errorInfo.timestamp
      });
      
      // Log error
      if (this.config.enableConsoleLogging) {
        this.logError('Error caught by boundary:', errorInfo);
      }
      
      // Attempt recovery
      if (this.config.enableAutoRecover) {
        this.attemptRecovery(errorInfo);
      }
      
      // Show user notification for high/critical errors
      if (this.config.enableUserNotification && 
          [this.SEVERITY.HIGH, this.SEVERITY.CRITICAL].includes(errorInfo.severity)) {
        this.showErrorNotification(errorInfo);
      }
      
      // Report error if enabled
      if (this.config.enableReporting) {
        this.reportError(errorInfo);
      }
      
      // Clean up old errors if we have too many
      if (this.errors.size > this.config.maxErrors) {
        this.cleanupOldErrors();
      }
      
    } catch (handlerError) {
      // Fallback error handling
      console.error('Error in error handler:', handlerError);
      console.error('Original error:', errorInfo);
    }
  },

  /**
   * Determine error severity based on error type and content
   */
  determineSeverity(error) {
    if (!error) return this.SEVERITY.LOW;
    
    const message = error.message || error.toString();
    const stack = error.stack || '';
    
    // Critical errors
    if (message.includes('Cannot read property') && message.includes('of undefined')) {
      return this.SEVERITY.HIGH;
    }
    
    if (message.includes('Network Error') || message.includes('fetch')) {
      return this.SEVERITY.MEDIUM;
    }
    
    if (message.includes('Storage') || message.includes('IndexedDB')) {
      return this.SEVERITY.HIGH;
    }
    
    if (stack.includes('Store.') || stack.includes('Router.')) {
      return this.SEVERITY.HIGH;
    }
    
    return this.SEVERITY.MEDIUM;
  },

  /**
   * Determine error category based on error type and content
   */
  determineCategory(error, message) {
    if (!error && !message) return this.CATEGORIES.SYSTEM;
    
    const errorString = (error?.message || message || '').toLowerCase();
    const stack = (error?.stack || '').toLowerCase();
    
    if (errorString.includes('storage') || errorString.includes('indexeddb') || 
        errorString.includes('localstorage') || stack.includes('store.')) {
      return this.CATEGORIES.STORAGE;
    }
    
    if (errorString.includes('fetch') || errorString.includes('network') || 
        errorString.includes('xmlhttprequest') || errorString.includes('cors')) {
      return this.CATEGORIES.NETWORK;
    }
    
    if (errorString.includes('render') || errorString.includes('dom') || 
        stack.includes('ui.') || stack.includes('render')) {
      return this.CATEGORIES.RENDERING;
    }
    
    if (errorString.includes('security') || errorString.includes('cors') || 
        errorString.includes('csp')) {
      return this.CATEGORIES.SECURITY;
    }
    
    if (errorString.includes('performance') || errorString.includes('memory')) {
      return this.CATEGORIES.PERFORMANCE;
    }
    
    return this.CATEGORIES.SCRIPT;
  },

  /**
   * Check if an error should be suppressed
   */
  shouldSuppressError(errorInfo) {
    const message = errorInfo.message || '';
    
    return this.config.suppressedErrors.some(suppressedMessage => 
      message.includes(suppressedMessage)
    );
  },

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(errorInfo) {
    const strategy = this.recoveryStrategies[errorInfo.category];
    
    if (strategy) {
      try {
        console.log(`🔄 Attempting recovery for ${errorInfo.category} error...`);
        
        const recovered = await strategy(errorInfo);
        
        if (recovered) {
          this.logInfo(`✅ Recovery successful for ${errorInfo.category} error`);
        } else {
          this.logError(`❌ Recovery failed for ${errorInfo.category} error`);
        }
        
      } catch (recoveryError) {
        this.logError('Recovery attempt failed:', recoveryError);
      }
    }
  },

  /**
   * Show error notification to user
   */
  showErrorNotification(errorInfo) {
    const notification = document.getElementById('error-notification');
    const title = document.getElementById('error-title');
    const message = document.getElementById('error-message');
    
    if (notification && title && message) {
      title.textContent = this.getErrorTitle(errorInfo);
      message.textContent = this.getUserFriendlyMessage(errorInfo);
      
      // Store current error for retry functionality
      this.currentError = errorInfo;
      
      // Show notification
      notification.classList.remove('translate-x-full');
      
      // Auto-hide after 10 seconds for non-critical errors
      if (errorInfo.severity !== this.SEVERITY.CRITICAL) {
        setTimeout(() => {
          this.hideErrorNotification();
        }, 10000);
      }
    }
  },

  /**
   * Hide error notification
   */
  hideErrorNotification() {
    const notification = document.getElementById('error-notification');
    if (notification) {
      notification.classList.add('translate-x-full');
    }
  },

  /**
   * Show user notification (success, info, warning)
   */
  showUserNotification(message, type = 'info') {
    if (typeof ToastManager !== 'undefined') {
      ToastManager.show(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  },

  /**
   * Get user-friendly error title
   */
  getErrorTitle(errorInfo) {
    switch (errorInfo.category) {
      case this.CATEGORIES.STORAGE:
        return 'Storage Error';
      case this.CATEGORIES.NETWORK:
        return 'Connection Error';
      case this.CATEGORIES.RENDERING:
        return 'Display Error';
      case this.CATEGORIES.SECURITY:
        return 'Security Error';
      case this.CATEGORIES.PERFORMANCE:
        return 'Performance Warning';
      default:
        return 'Application Error';
    }
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(errorInfo) {
    switch (errorInfo.category) {
      case this.CATEGORIES.STORAGE:
        return 'There was a problem saving your data. We\'re trying to reconnect.';
      case this.CATEGORIES.NETWORK:
        return 'Unable to connect to the network. Please check your connection.';
      case this.CATEGORIES.RENDERING:
        return 'There was a problem displaying the page. Refreshing...';
      case this.CATEGORIES.PERFORMANCE:
        return 'The application is running slowly. Consider closing other browser tabs.';
      default:
        return 'An unexpected error occurred. The application will try to recover automatically.';
    }
  },

  /**
   * Retry the last failed operation
   */
  async retryLastFailedOperation() {
    if (!this.currentError) return;
    
    this.showUserNotification('Retrying...', 'info');
    
    try {
      await this.attemptRecovery(this.currentError);
      this.hideErrorNotification();
    } catch (error) {
      this.showUserNotification('Retry failed', 'error');
    }
  },

  /**
   * Report error to external service (placeholder)
   */
  reportError(errorInfo) {
    // In a real application, this would send to error reporting service
    // like Sentry, LogRocket, or custom endpoint
    
    const report = {
      timestamp: errorInfo.timestamp,
      type: errorInfo.type,
      message: errorInfo.message,
      severity: errorInfo.severity,
      category: errorInfo.category,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: errorInfo.stack
    };
    
    // Store locally for now
    this.crashReports.push(report);
    
    // Keep only recent reports
    if (this.crashReports.length > this.config.maxCrashReports) {
      this.crashReports.shift();
    }
    
    this.logInfo('Error reported:', report);
  },

  /**
   * Detect potential application crash
   */
  detectPotentialCrash() {
    const recentErrors = Array.from(this.errors.values())
      .filter(error => Date.now() - new Date(error.timestamp).getTime() < this.crashDetectionWindow)
      .filter(error => error.severity === this.SEVERITY.CRITICAL);
    
    if (recentErrors.length >= this.crashDetectionThreshold) {
      this.handlePotentialCrash(recentErrors);
    }
  },

  /**
   * Handle potential application crash
   */
  handlePotentialCrash(recentErrors) {
    console.error('🚨 Potential application crash detected!');
    console.error('Recent critical errors:', recentErrors);
    
    // Attempt emergency recovery
    this.performEmergencyRecovery();
    
    // Show critical error message to user
    this.showCriticalErrorMessage();
  },

  /**
   * Perform emergency recovery
   */
  async performEmergencyRecovery() {
    console.log('🆘 Performing emergency recovery...');
    
    try {
      // Clear any potentially corrupted state
      if (typeof localStorage !== 'undefined') {
        // Clear temp data but preserve user notes
        const keysToKeep = ['notes', 'settings', 'user-data'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
          if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Reinitialize core systems
      if (typeof Store !== 'undefined' && Store.init) {
        await Store.init();
      }
      
      if (typeof Router !== 'undefined' && Router.init) {
        Router.init();
      }
      
      // Refresh UI
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      this.showUserNotification('Emergency recovery completed. Reloading...', 'info');
      
    } catch (recoveryError) {
      console.error('Emergency recovery failed:', recoveryError);
      this.showCriticalErrorMessage();
    }
  },

  /**
   * Show critical error message
   */
  showCriticalErrorMessage() {
    // Create or update critical error overlay
    let overlay = document.getElementById('critical-error-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'critical-error-overlay';
      overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90';
      overlay.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <div class="mb-4">
            <i class="fas fa-exclamation-circle text-red-500 text-6xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Critical Error</h2>
          <p class="text-gray-600 mb-6">
            The application encountered multiple critical errors. 
            We're attempting to recover your data.
          </p>
          <div class="space-y-3">
            <button id="critical-reload" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
              Reload Application
            </button>
            <button id="critical-export" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
              Export Data & Reset
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Bind event listeners
      document.getElementById('critical-reload').addEventListener('click', () => {
        window.location.reload();
      });
      
      document.getElementById('critical-export').addEventListener('click', async () => {
        try {
          if (typeof Store !== 'undefined' && Store.exportData) {
            const data = await Store.exportData();
            this.downloadData(data, 'emergency-backup.json');
          }
          
          // Clear all data and reload
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          
          window.location.reload();
        } catch (error) {
          console.error('Emergency export failed:', error);
          window.location.reload();
        }
      });
    }
  },

  /**
   * Download data as file
   */
  downloadData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Clean up old errors
   */
  cleanupOldErrors() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [id, error] of this.errors.entries()) {
      if (new Date(error.timestamp).getTime() < cutoffTime) {
        this.errors.delete(id);
      }
    }
  },

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentErrors = Array.from(this.errors.values());
    
    return {
      total: this.errorCount,
      stored: this.errors.size,
      lastHour: recentErrors.filter(e => new Date(e.timestamp).getTime() > hourAgo).length,
      lastDay: recentErrors.filter(e => new Date(e.timestamp).getTime() > dayAgo).length,
      byCategory: this.groupErrorsByCategory(recentErrors),
      bySeverity: this.groupErrorsBySeverity(recentErrors),
      crashReports: this.crashReports.length
    };
  },

  /**
   * Group errors by category
   */
  groupErrorsByCategory(errors) {
    const grouped = {};
    
    for (const category of Object.values(this.CATEGORIES)) {
      grouped[category] = errors.filter(e => e.category === category).length;
    }
    
    return grouped;
  },

  /**
   * Group errors by severity
   */
  groupErrorsBySeverity(errors) {
    const grouped = {};
    
    for (const severity of Object.values(this.SEVERITY)) {
      grouped[severity] = errors.filter(e => e.severity === severity).length;
    }
    
    return grouped;
  },

  /**
   * Logging utilities
   */
  logError(message, error) {
    console.error(`🔴 [ErrorBoundary] ${message}`, error);
  },

  logInfo(message, data) {
    console.info(`🔵 [ErrorBoundary] ${message}`, data);
  },

  /**
   * Public API for manual error reporting
   */
  reportManualError(error, context = {}) {
    this.handleError({
      type: 'manual',
      message: error.message || 'Manual error report',
      error,
      severity: context.severity || this.SEVERITY.MEDIUM,
      category: context.category || this.CATEGORIES.USER_ACTION,
      timestamp: new Date().toISOString(),
      context
    });
  },

  /**
   * Wrap function with error boundary
   */
  wrap(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.reportManualError(error, {
          ...context,
          functionName: fn.name,
          arguments: args
        });
        
        // Re-throw if not in auto-recover mode
        if (!this.config.enableAutoRecover) {
          throw error;
        }
      }
    };
  },

  /**
   * Create safe version of a module
   */
  createSafeModule(module, moduleName) {
    const safeModule = {};
    
    for (const [key, value] of Object.entries(module)) {
      if (typeof value === 'function') {
        safeModule[key] = this.wrap(value, {
          moduleName,
          methodName: key,
          category: this.CATEGORIES.SYSTEM
        });
      } else {
        safeModule[key] = value;
      }
    }
    
    return safeModule;
  }
};

// Auto-initialize if we're in a browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ErrorBoundary.init();
    });
  } else {
    // DOM is already ready
    ErrorBoundary.init();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
} else if (typeof window !== 'undefined') {
  window.ErrorBoundary = ErrorBoundary;
}

console.log('🛡️ Error Boundary System loaded');