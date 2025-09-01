// Advanced Performance Monitoring System
import type { PerformanceMetric } from '../types/index.js';

interface PerformanceBudget {
  operation: string;
  maxDuration: number;
  maxSize?: number;
  alertThreshold: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usage: number; // percentage
}

interface PerformanceReport {
  timestamp: string;
  metrics: PerformanceMetric[];
  memory: MemoryInfo | null;
  bundleSize: number;
  loadTime: number;
  issues: string[];
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private budgets: PerformanceBudget[] = [];
  private maxMetrics = 1000;
  private observers: Map<string, PerformanceObserver> = new Map();
  private vitals: Map<string, number> = new Map();
  
  constructor() {
    this.setupDefaultBudgets();
    this.setupObservers();
    this.trackWebVitals();
  }

  /**
   * Set up default performance budgets
   */
  private setupDefaultBudgets(): void {
    this.budgets = [
      { operation: 'allNotes', maxDuration: 100, alertThreshold: 200 },
      { operation: 'upsert', maxDuration: 50, alertThreshold: 100 },
      { operation: 'search', maxDuration: 50, alertThreshold: 100 },
      { operation: 'buildIndex', maxDuration: 200, alertThreshold: 500 },
      { operation: 'export', maxDuration: 1000, alertThreshold: 2000 },
      { operation: 'import', maxDuration: 1000, alertThreshold: 2000 },
      { operation: 'renderMD', maxDuration: 10, alertThreshold: 50 },
      { operation: 'app-initialization', maxDuration: 2000, alertThreshold: 5000 }
    ];
  }

  /**
   * Set up performance observers for automatic tracking
   */
  private setupObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackNavigation(navEntry);
          }
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Measure observer for custom metrics
    try {
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('mahart-')) {
            this.logMeasure(entry.name, entry.duration);
          }
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.set('measure', measureObserver);
    } catch (error) {
      console.warn('Measure observer not supported:', error);
    }

    // Long task observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logLongTask(entry as PerformanceLongTaskTiming);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackWebVitals(): void {
    // Track CLS (Cumulative Layout Shift)
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.vitals.set('CLS', clsValue);
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.warn('CLS tracking not supported:', error);
      }

      // Track FID (First Input Delay)
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.vitals.set('FID', (entry as any).processingStart - entry.startTime);
          }
        }).observe({ type: 'first-input', buffered: true });
      } catch (error) {
        console.warn('FID tracking not supported:', error);
      }

      // Track LCP (Largest Contentful Paint)
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.vitals.set('LCP', lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        console.warn('LCP tracking not supported:', error);
      }
    }
  }

  /**
   * Track navigation timing
   */
  private trackNavigation(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.navigationStart;
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
    
    this.logOperation('page-load', loadTime, 0, 0);
    this.logOperation('dom-ready', domContentLoaded, 0, 0);
    
    console.log(`Page load: ${Math.round(loadTime)}ms, DOM ready: ${Math.round(domContentLoaded)}ms`);
  }

  /**
   * Log long tasks that might block the main thread
   */
  private logLongTask(entry: PerformanceLongTaskTiming): void {
    console.warn(`Long task detected: ${Math.round(entry.duration)}ms`);
    this.logOperation('long-task', entry.duration, 0, 0);
  }

  /**
   * Log a custom performance measure
   */
  private logMeasure(name: string, duration: number): void {
    const operation = name.replace('mahart-', '');
    this.logOperation(operation, duration, 0, 0);
  }

  /**
   * Log a performance operation
   */
  logOperation(operation: string, duration: number, size = 0, noteCount = 0): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      size,
      noteCount,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Check against performance budgets
    this.checkBudget(metric);

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation: ${operation} took ${Math.round(duration)}ms`);
    }
  }

  /**
   * Check if operation exceeds performance budget
   */
  private checkBudget(metric: PerformanceMetric): void {
    const budget = this.budgets.find(b => b.operation === metric.operation);
    if (!budget) return;

    if (metric.duration > budget.alertThreshold) {
      console.error(`Performance budget exceeded: ${metric.operation} took ${Math.round(metric.duration)}ms (budget: ${budget.maxDuration}ms)`);
      
      // Could send alert to monitoring service here
      this.sendPerformanceAlert(metric, budget);
    } else if (metric.duration > budget.maxDuration) {
      console.warn(`Performance budget warning: ${metric.operation} took ${Math.round(metric.duration)}ms (budget: ${budget.maxDuration}ms)`);
    }
  }

  /**
   * Send performance alert
   */
  private sendPerformanceAlert(metric: PerformanceMetric, budget: PerformanceBudget): void {
    // In a real app, this would send to monitoring service
    const alertData = {
      type: 'performance_budget_exceeded',
      operation: metric.operation,
      duration: metric.duration,
      budget: budget.maxDuration,
      timestamp: new Date(metric.timestamp).toISOString()
    };
    
    console.error('Performance Alert:', alertData);
  }

  /**
   * Mark a performance point
   */
  mark(label: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`mahart-${label}`);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance === 'undefined' || !performance.measure) return 0;

    try {
      performance.measure(
        `mahart-${name}`,
        `mahart-${startMark}`,
        endMark ? `mahart-${endMark}` : undefined
      );

      const entries = performance.getEntriesByName(`mahart-${name}`);
      return entries.length > 0 ? entries[entries.length - 1].duration : 0;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return 0;
    }
  }

  /**
   * Get memory information
   */
  getMemoryInfo(): MemoryInfo | null {
    if (typeof (performance as any).memory === 'undefined') return null;

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const recent = this.metrics.slice(-50);
    const byOperation = new Map<string, PerformanceMetric[]>();

    // Group by operation
    recent.forEach(metric => {
      if (!byOperation.has(metric.operation)) {
        byOperation.set(metric.operation, []);
      }
      byOperation.get(metric.operation)!.push(metric);
    });

    // Calculate averages
    const operationStats = Array.from(byOperation.entries()).map(([operation, metrics]) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const maxDuration = Math.max(...metrics.map(m => m.duration));
      const totalCalls = metrics.length;

      return {
        operation,
        avgDuration: Math.round(avgDuration),
        maxDuration: Math.round(maxDuration),
        totalCalls,
        recentDuration: Math.round(metrics[metrics.length - 1]?.duration || 0)
      };
    });

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recent.length,
      operationStats,
      memory: this.getMemoryInfo(),
      webVitals: Object.fromEntries(this.vitals),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze for issues and recommendations
    stats.operationStats.forEach(stat => {
      const budget = this.budgets.find(b => b.operation === stat.operation);
      if (budget) {
        if (stat.avgDuration > budget.maxDuration) {
          issues.push(`${stat.operation} averaging ${stat.avgDuration}ms (budget: ${budget.maxDuration}ms)`);
          recommendations.push(`Optimize ${stat.operation} performance`);
        }
      }
    });

    // Memory usage recommendations
    if (stats.memory && stats.memory.usage > 80) {
      issues.push(`High memory usage: ${stats.memory.usage}%`);
      recommendations.push('Consider implementing more aggressive garbage collection or reducing memory footprint');
    }

    // Web Vitals recommendations
    if (stats.webVitals.CLS && stats.webVitals.CLS > 0.1) {
      issues.push(`Poor Cumulative Layout Shift: ${stats.webVitals.CLS}`);
      recommendations.push('Reduce layout shifts by setting explicit dimensions for dynamic content');
    }

    if (stats.webVitals.FID && stats.webVitals.FID > 100) {
      issues.push(`Poor First Input Delay: ${Math.round(stats.webVitals.FID)}ms`);
      recommendations.push('Reduce JavaScript execution time during page load');
    }

    if (stats.webVitals.LCP && stats.webVitals.LCP > 2500) {
      issues.push(`Poor Largest Contentful Paint: ${Math.round(stats.webVitals.LCP)}ms`);
      recommendations.push('Optimize largest content element loading');
    }

    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics.slice(-100), // Last 100 metrics
      memory: stats.memory,
      bundleSize: 0, // Could be calculated from build process
      loadTime: stats.operationStats.find(s => s.operation === 'page-load')?.recentDuration || 0,
      issues,
      recommendations
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.vitals.clear();
    console.log('Performance metrics cleared');
  }

  /**
   * Set custom performance budget
   */
  setBudget(operation: string, maxDuration: number, alertThreshold?: number): void {
    const existingIndex = this.budgets.findIndex(b => b.operation === operation);
    const budget: PerformanceBudget = {
      operation,
      maxDuration,
      alertThreshold: alertThreshold || maxDuration * 2
    };

    if (existingIndex >= 0) {
      this.budgets[existingIndex] = budget;
    } else {
      this.budgets.push(budget);
    }
  }

  /**
   * Initialize performance monitoring
   */
  init(): void {
    console.log('📊 Performance Monitor initialized');
    
    // Mark app initialization start
    this.mark('app-init-start');
    
    // Set up periodic reporting
    setInterval(() => {
      const stats = this.getStats();
      if (stats.totalMetrics > 0) {
        console.log('Performance Summary:', {
          totalMetrics: stats.totalMetrics,
          memoryUsage: stats.memory?.usage + '%',
          recentOperations: stats.operationStats.slice(0, 5)
        });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Create and export performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export const Performance = {
  logOperation: (operation: string, duration: number, size?: number, noteCount?: number) => 
    performanceMonitor.logOperation(operation, duration, size, noteCount),
  mark: (label: string) => performanceMonitor.mark(label),
  measure: (name: string, startMark: string, endMark?: string) => 
    performanceMonitor.measure(name, startMark, endMark),
  getStats: () => performanceMonitor.getStats(),
  generateReport: () => performanceMonitor.generateReport(),
  clearMetrics: () => performanceMonitor.clearMetrics(),
  setBudget: (operation: string, maxDuration: number, alertThreshold?: number) =>
    performanceMonitor.setBudget(operation, maxDuration, alertThreshold),
  init: () => performanceMonitor.init(),
  destroy: () => performanceMonitor.destroy(),
  getMemoryInfo: () => performanceMonitor.getMemoryInfo()
};