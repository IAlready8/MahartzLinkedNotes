/* Mahart Linked Notes - Comprehensive Performance Monitoring System */

/**
 * Enterprise-grade performance monitoring and optimization system
 * Tracks metrics, identifies bottlenecks, and provides optimization recommendations
 */

const PerformanceMonitor = {
  // Monitoring state
  isMonitoring: false,
  metrics: new Map(),
  observers: new Map(),
  thresholds: {},
  baseline: {},
  
  // Performance budgets (enterprise-grade targets)
  budgets: {
    // Page load performance
    firstContentfulPaint: 1500,    // 1.5s
    largestContentfulPaint: 2500,  // 2.5s
    firstInputDelay: 100,          // 100ms
    cumulativeLayoutShift: 0.1,    // 0.1 score
    timeToInteractive: 3000,       // 3s
    
    // Runtime performance
    longTaskThreshold: 50,         // 50ms
    memoryUsageThreshold: 0.8,     // 80% of heap limit
    frameRate: 55,                 // 55 FPS minimum
    
    // Application-specific
    noteLoadTime: 200,             // 200ms
    searchResponseTime: 150,       // 150ms
    saveOperationTime: 500,        // 500ms
    renderTime: 16,                // 16ms (60 FPS)
    
    // Network
    maxResourceLoadTime: 3000,     // 3s
    maxApiResponseTime: 1000       // 1s
  },
  
  // Metric collection intervals
  intervals: {
    memory: 30000,      // 30 seconds
    fps: 1000,          // 1 second
    network: 5000,      // 5 seconds
    cleanup: 300000     // 5 minutes
  },

  /**
   * Initialize the performance monitoring system
   */
  async init() {
    console.log('📊 Initializing Performance Monitor...');
    
    try {
      // Check browser support
      this.checkBrowserSupport();
      
      // Set up core web vitals monitoring
      this.initializeCoreWebVitals();
      
      // Set up runtime performance monitoring
      this.initializeRuntimeMonitoring();
      
      // Set up memory monitoring
      this.initializeMemoryMonitoring();
      
      // Set up network monitoring
      this.initializeNetworkMonitoring();
      
      // Set up application-specific monitoring
      this.initializeApplicationMonitoring();
      
      // Set up frame rate monitoring
      this.initializeFrameRateMonitoring();
      
      // Set up resource monitoring
      this.initializeResourceMonitoring();
      
      // Set up performance budgets
      this.initializePerformanceBudgets();
      
      // Start monitoring
      this.startMonitoring();
      
      // Set up performance dashboard
      this.initializePerformanceDashboard();
      
      // Set up automated optimization
      this.initializeAutoOptimization();
      
      console.log('✅ Performance Monitor initialized successfully');
      return { success: true, budgets: this.budgets };
      
    } catch (error) {
      console.error('❌ Failed to initialize Performance Monitor:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check browser support for performance APIs
   */
  checkBrowserSupport() {
    this.support = {
      performanceAPI: 'performance' in window,
      performanceObserver: 'PerformanceObserver' in window,
      navigationTiming: 'performance' in window && 'timing' in performance,
      resourceTiming: 'performance' in window && 'getEntriesByType' in performance,
      userTiming: 'performance' in window && 'mark' in performance,
      memory: 'performance' in window && 'memory' in performance,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      webVitals: 'PerformanceObserver' in window
    };
    
    console.log('🔍 Browser Performance API Support:', this.support);
  },

  /**
   * Initialize Core Web Vitals monitoring
   */
  initializeCoreWebVitals() {
    if (!this.support.webVitals) {
      console.warn('⚠️ Web Vitals not supported');
      return;
    }
    
    // First Contentful Paint (FCP)
    this.observePerformance('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('first_contentful_paint', entry.startTime, {
            budget: this.budgets.firstContentfulPaint,
            unit: 'ms',
            critical: true
          });
        }
      }
    });
    
    // Largest Contentful Paint (LCP)
    this.observePerformance('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.recordMetric('largest_contentful_paint', lastEntry.startTime, {
          budget: this.budgets.largestContentfulPaint,
          unit: 'ms',
          critical: true,
          element: lastEntry.element
        });
      }
    });
    
    // First Input Delay (FID)
    this.observePerformance('first-input', (entries) => {
      for (const entry of entries) {
        this.recordMetric('first_input_delay', entry.processingStart - entry.startTime, {
          budget: this.budgets.firstInputDelay,
          unit: 'ms',
          critical: true,
          eventType: entry.name
        });
      }
    });
    
    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    this.observePerformance('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      
      this.recordMetric('cumulative_layout_shift', clsScore, {
        budget: this.budgets.cumulativeLayoutShift,
        unit: 'score',
        critical: true
      });
    });
  },

  /**
   * Initialize runtime performance monitoring
   */
  initializeRuntimeMonitoring() {
    // Long tasks monitoring
    if (this.support.performanceObserver) {
      this.observePerformance('longtask', (entries) => {
        for (const entry of entries) {
          this.recordMetric('long_task', entry.duration, {
            budget: this.budgets.longTaskThreshold,
            unit: 'ms',
            startTime: entry.startTime,
            attribution: entry.attribution
          });
          
          // Alert for tasks over budget
          if (entry.duration > this.budgets.longTaskThreshold) {
            this.handlePerformanceViolation('long_task', entry.duration, this.budgets.longTaskThreshold);
          }
        }
      });
    }
    
    // Navigation timing
    if (this.support.navigationTiming) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const navigationStart = timing.navigationStart;
          
          // Calculate key timing metrics
          const metrics = {
            dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
            tcp_connection: timing.connectEnd - timing.connectStart,
            request_response: timing.responseEnd - timing.requestStart,
            dom_processing: timing.domComplete - timing.domLoading,
            page_load_time: timing.loadEventEnd - navigationStart,
            dom_content_loaded: timing.domContentLoadedEventEnd - navigationStart
          };
          
          // Record all navigation metrics
          for (const [name, value] of Object.entries(metrics)) {
            this.recordMetric(`navigation_${name}`, value, {
              unit: 'ms',
              category: 'navigation'
            });
          }
          
          // Check Time to Interactive (approximate)
          const tti = Math.max(
            timing.domInteractive - navigationStart,
            timing.loadEventEnd - navigationStart
          );
          
          this.recordMetric('time_to_interactive', tti, {
            budget: this.budgets.timeToInteractive,
            unit: 'ms',
            critical: true
          });
          
        }, 0);
      });
    }
  },

  /**
   * Initialize memory monitoring
   */
  initializeMemoryMonitoring() {
    if (!this.support.memory) {
      console.warn('⚠️ Memory monitoring not supported');
      return;
    }
    
    // Monitor memory usage periodically
    setInterval(() => {
      const memory = performance.memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      this.recordMetric('memory_usage', memory.usedJSHeapSize, {
        unit: 'bytes',
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        ratio: usageRatio
      });
      
      // Check against budget
      if (usageRatio > this.budgets.memoryUsageThreshold) {
        this.handlePerformanceViolation('memory_usage', usageRatio, this.budgets.memoryUsageThreshold);
      }
      
    }, this.intervals.memory);
  },

  /**
   * Initialize network monitoring
   */
  initializeNetworkMonitoring() {
    // Resource timing monitoring
    if (this.support.resourceTiming) {
      this.observePerformance('resource', (entries) => {
        for (const entry of entries) {
          const loadTime = entry.responseEnd - entry.startTime;
          
          this.recordMetric('resource_load_time', loadTime, {
            budget: this.budgets.maxResourceLoadTime,
            unit: 'ms',
            url: entry.name,
            type: this.getResourceType(entry),
            size: entry.transferSize || entry.encodedBodySize,
            cached: entry.transferSize === 0 && entry.encodedBodySize > 0
          });
          
          // Alert for slow resources
          if (loadTime > this.budgets.maxResourceLoadTime) {
            this.handlePerformanceViolation('resource_load_time', loadTime, this.budgets.maxResourceLoadTime, {
              resource: entry.name
            });
          }
        }
      });
    }
    
    // Network quality estimation
    if ('connection' in navigator) {
      this.recordMetric('network_connection_type', navigator.connection.effectiveType, {
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      });
    }
  },

  /**
   * Initialize application-specific monitoring
   */
  initializeApplicationMonitoring() {
    // Note operations monitoring
    this.monitorNoteOperations();
    
    // Search performance monitoring
    this.monitorSearchPerformance();
    
    // UI interaction monitoring
    this.monitorUIInteractions();
    
    // Storage performance monitoring
    this.monitorStoragePerformance();
  },

  /**
   * Monitor note operations
   */
  monitorNoteOperations() {
    // Wrap Store methods with performance monitoring
    if (typeof Store !== 'undefined') {
      const originalMethods = {};
      
      ['getNote', 'upsert', 'deleteNote', 'allNotes', 'search'].forEach(method => {
        if (typeof Store[method] === 'function') {
          originalMethods[method] = Store[method];
          
          Store[method] = async (...args) => {
            const startTime = performance.now();
            
            try {
              const result = await originalMethods[method].apply(Store, args);
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              // Determine budget based on operation
              const budget = method === 'search' ? this.budgets.searchResponseTime :
                           method === 'upsert' ? this.budgets.saveOperationTime :
                           this.budgets.noteLoadTime;
              
              this.recordMetric(`store_${method}`, duration, {
                budget,
                unit: 'ms',
                args: args.length,
                success: true
              });
              
              if (duration > budget) {
                this.handlePerformanceViolation(`store_${method}`, duration, budget);
              }
              
              return result;
            } catch (error) {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              this.recordMetric(`store_${method}`, duration, {
                unit: 'ms',
                args: args.length,
                success: false,
                error: error.message
              });
              
              throw error;
            }
          };
        }
      });
    }
  },

  /**
   * Monitor search performance
   */
  monitorSearchPerformance() {
    if (typeof Search !== 'undefined' && typeof Search.search === 'function') {
      const originalSearch = Search.search;
      
      Search.search = (query, options = {}) => {
        const startTime = performance.now();
        
        try {
          const results = originalSearch.call(Search, query, options);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.recordMetric('search_performance', duration, {
            budget: this.budgets.searchResponseTime,
            unit: 'ms',
            query: query.substring(0, 50), // Truncate for privacy
            queryLength: query.length,
            resultsCount: results?.length || 0,
            options
          });
          
          if (duration > this.budgets.searchResponseTime) {
            this.handlePerformanceViolation('search_performance', duration, this.budgets.searchResponseTime);
          }
          
          return results;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.recordMetric('search_performance', duration, {
            unit: 'ms',
            query: query.substring(0, 50),
            error: error.message,
            success: false
          });
          
          throw error;
        }
      };
    }
  },

  /**
   * Monitor UI interactions
   */
  monitorUIInteractions() {
    // Monitor input responsiveness
    ['input', 'click', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        // Use requestIdleCallback to measure when the event was fully processed
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.recordMetric('ui_response_time', responseTime, {
              budget: this.budgets.firstInputDelay,
              unit: 'ms',
              eventType,
              target: event.target?.tagName?.toLowerCase()
            });
          });
        }
      }, { passive: true });
    });
  },

  /**
   * Monitor storage performance
   */
  monitorStoragePerformance() {
    // Monitor IndexedDB operations
    if (typeof localforage !== 'undefined') {
      const originalMethods = {};
      
      ['getItem', 'setItem', 'removeItem'].forEach(method => {
        if (typeof localforage[method] === 'function') {
          originalMethods[method] = localforage[method];
          
          localforage[method] = async (...args) => {
            const startTime = performance.now();
            
            try {
              const result = await originalMethods[method].apply(localforage, args);
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              this.recordMetric(`storage_${method}`, duration, {
                budget: 100, // 100ms budget for storage operations
                unit: 'ms',
                key: typeof args[0] === 'string' ? args[0].substring(0, 20) : 'unknown',
                success: true
              });
              
              return result;
            } catch (error) {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              this.recordMetric(`storage_${method}`, duration, {
                unit: 'ms',
                key: typeof args[0] === 'string' ? args[0].substring(0, 20) : 'unknown',
                success: false,
                error: error.message
              });
              
              throw error;
            }
          };
        }
      });
    }
  },

  /**
   * Initialize frame rate monitoring
   */
  initializeFrameRateMonitoring() {
    let frames = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) { // Every second
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        this.recordMetric('frame_rate', fps, {
          budget: this.budgets.frameRate,
          unit: 'fps',
          timestamp: currentTime
        });
        
        if (fps < this.budgets.frameRate) {
          this.handlePerformanceViolation('frame_rate', fps, this.budgets.frameRate);
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  },

  /**
   * Initialize resource monitoring
   */
  initializeResourceMonitoring() {
    // Monitor script loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target.tagName) {
        this.recordMetric('resource_error', 1, {
          type: event.target.tagName.toLowerCase(),
          source: event.target.src || event.target.href,
          message: event.message
        });
      }
    }, true);
    
    // Monitor CSS and image loading
    if (this.support.intersectionObserver) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.tagName === 'IMG') {
            const startTime = performance.now();
            
            entry.target.addEventListener('load', () => {
              const loadTime = performance.now() - startTime;
              this.recordMetric('image_load_time', loadTime, {
                unit: 'ms',
                src: entry.target.src.substring(0, 50),
                visible: true
              });
            }, { once: true });
          }
        });
      });
      
      // Observe all images
      document.querySelectorAll('img').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },

  /**
   * Initialize performance budgets
   */
  initializePerformanceBudgets() {
    // Create performance budget monitoring
    this.budgetViolations = new Map();
    
    // Set up budget alerts
    this.budgetAlertThreshold = 3; // Alert after 3 violations
    this.budgetAlertWindow = 60000; // 1 minute window
  },

  /**
   * Start monitoring
   */
  startMonitoring() {
    this.isMonitoring = true;
    this.monitoringStartTime = performance.now();
    
    // Start periodic cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.intervals.cleanup);
    
    console.log('📊 Performance monitoring started');
  },

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    if (!this.isMonitoring) return;
    
    const timestamp = performance.now();
    const metricId = `${name}_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;
    
    const metric = {
      id: metricId,
      name,
      value,
      timestamp,
      metadata,
      violatesBudget: metadata.budget ? value > metadata.budget : false
    };
    
    this.metrics.set(metricId, metric);
    
    // Emit metric event for other systems
    this.emitMetricEvent(metric);
    
    // Check for performance violations
    if (metric.violatesBudget) {
      this.handlePerformanceViolation(name, value, metadata.budget, metadata);
    }
    
    return metric;
  },

  /**
   * Observe performance entries
   */
  observePerformance(entryType, callback) {
    if (!this.support.performanceObserver) return;
    
    try {
      const observer = new PerformanceObserver(callback);
      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  },

  /**
   * Handle performance violations
   */
  handlePerformanceViolation(metricName, actualValue, budgetValue, context = {}) {
    const violationId = `${metricName}_${Date.now()}`;
    const violation = {
      id: violationId,
      metric: metricName,
      actual: actualValue,
      budget: budgetValue,
      severity: this.calculateViolationSeverity(actualValue, budgetValue),
      timestamp: new Date().toISOString(),
      context
    };
    
    // Track violations
    if (!this.budgetViolations.has(metricName)) {
      this.budgetViolations.set(metricName, []);
    }
    
    this.budgetViolations.get(metricName).push(violation);
    
    // Clean old violations
    this.cleanupOldViolations(metricName);
    
    // Check if we need to alert
    const recentViolations = this.budgetViolations.get(metricName);
    if (recentViolations.length >= this.budgetAlertThreshold) {
      this.alertPerformanceIssue(metricName, violation);
    }
    
    // Log violation
    console.warn(`⚠️ Performance Budget Violation: ${metricName}`, violation);
    
    // Try to auto-optimize if enabled
    this.attemptAutoOptimization(metricName, violation);
  },

  /**
   * Calculate violation severity
   */
  calculateViolationSeverity(actual, budget) {
    const ratio = actual / budget;
    
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  },

  /**
   * Alert performance issue
   */
  alertPerformanceIssue(metricName, violation) {
    console.error(`🚨 Performance Alert: ${metricName} consistently violating budget`);
    
    // Show user notification for critical issues
    if (violation.severity === 'critical' && typeof ToastManager !== 'undefined') {
      ToastManager.show(
        `Performance issue detected: ${this.getMetricDisplayName(metricName)}`,
        'warning'
      );
    }
    
    // Report to error boundary if available
    if (typeof ErrorBoundary !== 'undefined') {
      ErrorBoundary.reportManualError(
        new Error(`Performance budget violation: ${metricName}`),
        {
          category: 'performance',
          severity: violation.severity,
          metric: violation
        }
      );
    }
  },

  /**
   * Get user-friendly metric name
   */
  getMetricDisplayName(metricName) {
    const displayNames = {
      'first_contentful_paint': 'Page loading',
      'largest_contentful_paint': 'Content rendering',
      'long_task': 'Application responsiveness',
      'memory_usage': 'Memory usage',
      'search_performance': 'Search speed',
      'store_upsert': 'Save performance',
      'frame_rate': 'Animation smoothness'
    };
    
    return displayNames[metricName] || metricName.replace(/_/g, ' ');
  },

  /**
   * Initialize performance dashboard
   */
  initializePerformanceDashboard() {
    // Create performance dashboard overlay
    this.createPerformanceDashboard();
    
    // Set up keyboard shortcut (Ctrl+Shift+P)
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.togglePerformanceDashboard();
      }
    });
  },

  /**
   * Create performance dashboard
   */
  createPerformanceDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'performance-dashboard';
    dashboard.className = 'fixed top-4 left-4 w-80 max-h-96 bg-black bg-opacity-90 text-white rounded-lg p-4 font-mono text-xs overflow-y-auto z-50 hidden';
    dashboard.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-bold">Performance Monitor</h3>
        <button id="perf-dashboard-close" class="text-gray-400 hover:text-white">×</button>
      </div>
      <div id="perf-dashboard-content">
        <!-- Content will be populated dynamically -->
      </div>
      <div class="mt-3 text-xs text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    `;
    
    document.body.appendChild(dashboard);
    
    // Bind close button
    document.getElementById('perf-dashboard-close').addEventListener('click', () => {
      this.hidePerformanceDashboard();
    });
    
    // Update dashboard periodically
    setInterval(() => {
      if (!dashboard.classList.contains('hidden')) {
        this.updatePerformanceDashboard();
      }
    }, 2000);
  },

  /**
   * Toggle performance dashboard
   */
  togglePerformanceDashboard() {
    const dashboard = document.getElementById('performance-dashboard');
    if (dashboard) {
      dashboard.classList.toggle('hidden');
      if (!dashboard.classList.contains('hidden')) {
        this.updatePerformanceDashboard();
      }
    }
  },

  /**
   * Hide performance dashboard
   */
  hidePerformanceDashboard() {
    const dashboard = document.getElementById('performance-dashboard');
    if (dashboard) {
      dashboard.classList.add('hidden');
    }
  },

  /**
   * Update performance dashboard content
   */
  updatePerformanceDashboard() {
    const content = document.getElementById('perf-dashboard-content');
    if (!content) return;
    
    const stats = this.getPerformanceStats();
    
    content.innerHTML = `
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-gray-800 p-2 rounded">
            <div class="text-green-400">${stats.fps || 'N/A'} FPS</div>
            <div class="text-xs text-gray-400">Frame Rate</div>
          </div>
          <div class="bg-gray-800 p-2 rounded">
            <div class="text-${stats.memoryUsage > 80 ? 'red' : 'yellow'}-400">${stats.memoryUsage || 'N/A'}%</div>
            <div class="text-xs text-gray-400">Memory</div>
          </div>
        </div>
        
        <div class="bg-gray-800 p-2 rounded">
          <div class="text-blue-400">${stats.totalMetrics || 0} metrics</div>
          <div class="text-xs text-gray-400">Total Recorded</div>
        </div>
        
        <div class="bg-gray-800 p-2 rounded">
          <div class="text-${stats.violations > 0 ? 'red' : 'green'}-400">${stats.violations || 0} violations</div>
          <div class="text-xs text-gray-400">Budget Violations</div>
        </div>
        
        ${stats.slowestOperations.length > 0 ? `
        <div class="bg-gray-800 p-2 rounded">
          <div class="text-xs text-gray-400 mb-1">Slowest Operations:</div>
          ${stats.slowestOperations.map(op => `
            <div class="text-xs text-red-400">${op.name}: ${op.value.toFixed(1)}ms</div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const metrics = Array.from(this.metrics.values());
    const now = performance.now();
    const recentMetrics = metrics.filter(m => now - m.timestamp < 60000); // Last minute
    
    // Calculate FPS
    const fpsMetrics = recentMetrics.filter(m => m.name === 'frame_rate');
    const latestFps = fpsMetrics.length > 0 ? fpsMetrics[fpsMetrics.length - 1].value : null;
    
    // Calculate memory usage
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_usage');
    const latestMemory = memoryMetrics.length > 0 ? 
      Math.round(memoryMetrics[memoryMetrics.length - 1].metadata.ratio * 100) : null;
    
    // Count violations
    const violations = Array.from(this.budgetViolations.values())
      .reduce((total, violationList) => total + violationList.length, 0);
    
    // Get slowest operations
    const operationMetrics = recentMetrics.filter(m => 
      m.name.startsWith('store_') || m.name === 'search_performance'
    );
    const slowestOperations = operationMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(m => ({ name: m.name.replace(/_/g, ' '), value: m.value }));
    
    return {
      fps: latestFps,
      memoryUsage: latestMemory,
      totalMetrics: metrics.length,
      recentMetrics: recentMetrics.length,
      violations,
      slowestOperations
    };
  },

  /**
   * Initialize auto optimization
   */
  initializeAutoOptimization() {
    this.optimizationStrategies = {
      memory_usage: () => {
        // Trigger garbage collection if available
        if ('gc' in window && typeof window.gc === 'function') {
          window.gc();
        }
        
        // Clear metric history
        this.cleanupOldMetrics(0.5); // Keep only 50% of metrics
        
        console.log('🔧 Applied memory optimization');
      },
      
      long_task: () => {
        // Schedule non-critical work for idle time
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            // Defer any pending work
            console.log('🔧 Deferred work to idle time');
          });
        }
      },
      
      search_performance: () => {
        // Debounce search operations more aggressively
        if (typeof Search !== 'undefined' && Search.debounceSearch) {
          Search.debounceSearch(500); // Increase debounce to 500ms
          console.log('🔧 Increased search debounce');
        }
      }
    };
  },

  /**
   * Attempt auto optimization
   */
  attemptAutoOptimization(metricName, violation) {
    const strategy = this.optimizationStrategies[metricName];
    
    if (strategy && violation.severity === 'high' || violation.severity === 'critical') {
      try {
        strategy();
        console.log(`🔧 Auto-optimization applied for ${metricName}`);
      } catch (error) {
        console.error(`Failed to auto-optimize ${metricName}:`, error);
      }
    }
  },

  /**
   * Utility methods
   */
  
  getResourceType(entry) {
    if (entry.name.includes('.js')) return 'script';
    if (entry.name.includes('.css')) return 'stylesheet';
    if (entry.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
    if (entry.name.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    return 'other';
  },

  cleanupOldMetrics(keepRatio = 0.8) {
    const metricsArray = Array.from(this.metrics.entries());
    const keepCount = Math.floor(metricsArray.length * keepRatio);
    
    // Sort by timestamp and keep the most recent
    const sortedMetrics = metricsArray.sort((a, b) => b[1].timestamp - a[1].timestamp);
    const metricsToKeep = sortedMetrics.slice(0, keepCount);
    
    this.metrics.clear();
    metricsToKeep.forEach(([id, metric]) => {
      this.metrics.set(id, metric);
    });
    
    console.log(`🧹 Cleaned up metrics: kept ${keepCount} of ${metricsArray.length}`);
  },

  cleanupOldViolations(metricName) {
    const violations = this.budgetViolations.get(metricName) || [];
    const cutoffTime = Date.now() - this.budgetAlertWindow;
    
    const recentViolations = violations.filter(v => 
      new Date(v.timestamp).getTime() > cutoffTime
    );
    
    this.budgetViolations.set(metricName, recentViolations);
  },

  emitMetricEvent(metric) {
    // Emit custom event for other systems to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performanceMetric', {
        detail: metric
      }));
    }
  },

  /**
   * Public API
   */
  
  // Export performance data
  exportPerformanceData() {
    return {
      metrics: Array.from(this.metrics.values()),
      violations: Object.fromEntries(this.budgetViolations),
      budgets: this.budgets,
      support: this.support,
      stats: this.getPerformanceStats(),
      timestamp: new Date().toISOString()
    };
  },
  
  // Get current performance score
  getPerformanceScore() {
    const metrics = Array.from(this.metrics.values());
    const recentMetrics = metrics.filter(m => 
      performance.now() - m.timestamp < 60000 && m.metadata.budget
    );
    
    if (recentMetrics.length === 0) return null;
    
    let totalScore = 0;
    let scoredMetrics = 0;
    
    recentMetrics.forEach(metric => {
      const ratio = metric.value / metric.metadata.budget;
      const score = Math.max(0, 100 - (ratio - 1) * 50); // Score decreases as we exceed budget
      totalScore += score;
      scoredMetrics++;
    });
    
    return Math.round(totalScore / scoredMetrics);
  },
  
  // Manual performance mark
  mark(name, metadata = {}) {
    if (this.support.userTiming) {
      performance.mark(name);
    }
    
    return this.recordMetric(`user_mark_${name}`, performance.now(), {
      ...metadata,
      type: 'user_mark'
    });
  },
  
  // Measure between marks
  measure(name, startMark, endMark, metadata = {}) {
    if (this.support.userTiming) {
      performance.measure(name, startMark, endMark);
      
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        
        return this.recordMetric(`user_measure_${name}`, measure.duration, {
          ...metadata,
          type: 'user_measure',
          startMark,
          endMark
        });
      }
    }
    
    return null;
  }
};

// Auto-initialize if we're in a browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceMonitor.init();
    });
  } else {
    // DOM is already ready
    PerformanceMonitor.init();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
} else if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
}

console.log('📊 Performance Monitor System loaded');