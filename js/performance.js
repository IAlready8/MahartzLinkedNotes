// Performance optimization utilities for large datasets
const Performance = {
  cache: {
    searchIndex: null,
    searchTimestamp: 0,
    tagFrequency: null,
    tagTimestamp: 0,
    analytics: null,
    analyticsTimestamp: 0
  },
  
  // Cache duration in milliseconds
  CACHE_DURATION: 30000, // 30 seconds
  
  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle utility  
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy loading for large lists
  createVirtualList(container, items, renderItem, itemHeight = 50) {
    const containerHeight = container.offsetHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // buffer
    let startIndex = 0;
    
    const totalHeight = items.length * itemHeight;
    const viewport = document.createElement('div');
    viewport.style.height = totalHeight + 'px';
    viewport.style.position = 'relative';
    
    const renderVisible = () => {
      viewport.innerHTML = '';
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = document.createElement('div');
        item.style.position = 'absolute';
        item.style.top = (i * itemHeight) + 'px';
        item.style.height = itemHeight + 'px';
        item.style.width = '100%';
        item.innerHTML = renderItem(items[i], i);
        viewport.appendChild(item);
      }
    };
    
    container.style.overflow = 'auto';
    container.innerHTML = '';
    container.appendChild(viewport);
    
    container.addEventListener('scroll', this.throttle(() => {
      startIndex = Math.floor(container.scrollTop / itemHeight);
      renderVisible();
    }, 16)); // ~60fps
    
    renderVisible();
    
    return {
      update: (newItems) => {
        items = newItems;
        viewport.style.height = (items.length * itemHeight) + 'px';
        renderVisible();
      }
    };
  },

  // Cached search index
  async buildSearchIndex(notes) {
    const now = Date.now();
    
    if (this.cache.searchIndex && 
        (now - this.cache.searchTimestamp) < this.CACHE_DURATION) {
      return this.cache.searchIndex;
    }
    
    console.time('Building search index');
    
    const index = {
      notes: new Map(),
      terms: new Map(),
      titles: new Map(),
      tags: new Map()
    };
    
    notes.forEach(note => {
      // Store note data
      index.notes.set(note.id, {
        id: note.id,
        title: note.title,
        body: note.body || '',
        tags: note.tags || [],
        links: note.links || [],
        updatedAt: note.updatedAt
      });
      
      // Index title terms
      const titleTerms = this.extractTerms(note.title);
      titleTerms.forEach(term => {
        if (!index.titles.has(term)) {
          index.titles.set(term, new Set());
        }
        index.titles.get(term).add(note.id);
      });
      
      // Index body terms
      const bodyTerms = this.extractTerms(note.body || '');
      bodyTerms.forEach(term => {
        if (!index.terms.has(term)) {
          index.terms.set(term, new Set());
        }
        index.terms.get(term).add(note.id);
      });
      
      // Index tags
      (note.tags || []).forEach(tag => {
        const normalizedTag = tag.toLowerCase();
        if (!index.tags.has(normalizedTag)) {
          index.tags.set(normalizedTag, new Set());
        }
        index.tags.get(normalizedTag).add(note.id);
      });
    });
    
    console.timeEnd('Building search index');
    
    this.cache.searchIndex = index;
    this.cache.searchTimestamp = now;
    
    return index;
  },

  extractTerms(text) {
    return text.toLowerCase()
      .split(/\s+/)
      .map(term => term.replace(/[^\w]/g, ''))
      .filter(term => term.length > 2);
  },

  // Fast search using cached index
  async fastSearch(query, notes) {
    const index = await this.buildSearchIndex(notes);
    const tokens = this.extractTerms(query);
    
    if (tokens.length === 0) return [];
    
    console.time('Fast search');
    
    const candidates = new Map(); // noteId -> score
    
    tokens.forEach(token => {
      // Title matches (highest score)
      const titleMatches = index.titles.get(token) || new Set();
      titleMatches.forEach(noteId => {
        candidates.set(noteId, (candidates.get(noteId) || 0) + 20);
      });
      
      // Tag matches (medium score)
      const tagMatches = index.tags.get(token) || new Set();
      tagMatches.forEach(noteId => {
        candidates.set(noteId, (candidates.get(noteId) || 0) + 10);
      });
      
      // Body matches (lower score)
      const bodyMatches = index.terms.get(token) || new Set();
      bodyMatches.forEach(noteId => {
        candidates.set(noteId, (candidates.get(noteId) || 0) + 1);
      });
    });
    
    // Convert to results with note data
    const results = Array.from(candidates.entries())
      .map(([noteId, score]) => ({
        ...index.notes.get(noteId),
        searchScore: score
      }))
      .sort((a, b) => b.searchScore - a.searchScore);
    
    console.timeEnd('Fast search');
    
    return results;
  },

  // Cached tag frequency calculation
  async getTagFrequency(notes) {
    const now = Date.now();
    
    if (this.cache.tagFrequency && 
        (now - this.cache.tagTimestamp) < this.CACHE_DURATION) {
      return this.cache.tagFrequency;
    }
    
    console.time('Computing tag frequency');
    
    const frequency = new Map();
    
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        frequency.set(tag, (frequency.get(tag) || 0) + 1);
      });
    });
    
    const result = Array.from(frequency.entries())
      .sort(([,a], [,b]) => b - a);
    
    console.timeEnd('Computing tag frequency');
    
    this.cache.tagFrequency = result;
    this.cache.tagTimestamp = now;
    
    return result;
  },

  // Cached analytics computation
  async computeAnalytics(notes) {
    const now = Date.now();
    
    if (this.cache.analytics && 
        (now - this.cache.analyticsTimestamp) < this.CACHE_DURATION) {
      return this.cache.analytics;
    }
    
    console.time('Computing analytics');
    
    const analytics = {
      total: notes.length,
      totalWords: 0,
      totalLinks: 0,
      avgWords: 0,
      avgLinks: 0,
      healthyNotes: 0,
      healthPercent: 0,
      isolatedNotes: 0,
      dailyActivity: {}
    };
    
    // Initialize daily activity for last 30 days
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      analytics.dailyActivity[dateStr] = 0;
    }
    
    // Process notes in batches to avoid blocking UI
    const batchSize = 100;
    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      
      batch.forEach(note => {
        const wordCount = (note.body || '').split(/\s+/).length;
        const linkCount = (note.links || []).length;
        
        analytics.totalWords += wordCount;
        analytics.totalLinks += linkCount;
        
        if (linkCount >= 2) analytics.healthyNotes++;
        if (linkCount === 0) analytics.isolatedNotes++;
        
        // Update daily activity
        const updatedDate = new Date(note.updatedAt).toISOString().split('T')[0];
        if (analytics.dailyActivity.hasOwnProperty(updatedDate)) {
          analytics.dailyActivity[updatedDate]++;
        }
      });
      
      // Yield control to prevent blocking
      if (i % (batchSize * 5) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    analytics.avgWords = Math.round(analytics.totalWords / (notes.length || 1));
    analytics.avgLinks = (analytics.totalLinks / (notes.length || 1)).toFixed(1);
    analytics.healthPercent = Math.round((analytics.healthyNotes / (notes.length || 1)) * 100);
    
    console.timeEnd('Computing analytics');
    
    this.cache.analytics = analytics;
    this.cache.analyticsTimestamp = now;
    
    return analytics;
  },

  // Memory management
  clearCache() {
    this.cache = {
      searchIndex: null,
      searchTimestamp: 0,
      tagFrequency: null,
      tagTimestamp: 0,
      analytics: null,
      analyticsTimestamp: 0
    };
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    console.log('Performance cache cleared');
  },

  // Monitor performance
  startPerformanceMonitor() {
    if (!window.performance) return;
    
    const monitor = {
      memoryUsage: 0,
      renderTime: 0,
      searchTime: 0
    };
    
    // Memory monitoring (if available)
    if (performance.memory) {
      monitor.memoryUsage = performance.memory.usedJSHeapSize;
    }
    
    // Store in global for debugging
    window._performanceMonitor = monitor;
    
    return monitor;
  },

  // Batch DOM updates
  batchDOMUpdate(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Lazy image loading for large note collections
  setupLazyLoading(container) {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const callback = element._lazyCallback;
          if (callback) {
            callback();
            observer.unobserve(element);
          }
        }
      });
    }, {
      root: container,
      threshold: 0.1
    });
    
    return observer;
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  Performance.startPerformanceMonitor();
  
  // Clear cache periodically
  setInterval(() => {
    Performance.clearCache();
  }, 5 * 60 * 1000); // 5 minutes
}