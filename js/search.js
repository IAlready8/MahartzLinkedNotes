/* search.js — enhanced search with filters and advanced querying */
const Search = {
  index: [],
  filters: {
    tags: [],
    dateFrom: null,
    dateTo: null,
    minLinks: null,
    hasBacklinks: false
  },
  
  // Performance optimized index building with caching
  buildIndex(notes){
    const startTime = performance.now();
    
    // Build backlink map once for better performance
    const backlinkMap = new Map();
    notes.forEach(note => {
      (note.links || []).forEach(linkId => {
        backlinkMap.set(linkId, (backlinkMap.get(linkId) || 0) + 1);
      });
    });
    
    // Build optimized index with better tokenization
    this.index = notes.map(n => {
      // More efficient tokenization - cache tokens if note hasn't changed
      const cacheKey = `${n.id}_${n.updatedAt}`;
      const cachedTokens = this.tokenCache?.get(cacheKey);
      
      let bag;
      if (cachedTokens) {
        bag = cachedTokens;
      } else {
        const textContent = [n.title || '', (n.tags || []).join(' '), n.body || ''].join(' ');
        bag = uniq(tokenize(textContent));
        
        // Cache tokenization result
        if (!this.tokenCache) this.tokenCache = new Map();
        if (this.tokenCache.size > 500) {
          const firstKey = this.tokenCache.keys().next().value;
          this.tokenCache.delete(firstKey);
        }
        this.tokenCache.set(cacheKey, bag);
      }
      
      return { 
        id: n.id, 
        title: n.title || '', 
        tags: n.tags || [], 
        bag,
        links: n.links || [],
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        backlinkCount: backlinkMap.get(n.id) || 0,
        bodyLength: (n.body || '').length,
        score: 0 // Will be calculated during search
      };
    });
    
    console.log(`Index built in ${(performance.now() - startTime).toFixed(2)}ms`);
  },
  
  query(q, filters = {}){
    // Parse query for special operators
    const { textQuery, tagFilters, dateFilters, linkFilters } = this.parseQuery(q);
    
    // Combine filters
    const combinedFilters = {
      ...this.filters,
      ...filters,
      tags: [...this.filters.tags, ...tagFilters],
      ...dateFilters,
      ...linkFilters
    };
    
    // Get text tokens
    const toks = uniq(tokenize(textQuery));
    
    // Filter and score documents
    let results = this.index
      .filter(doc => this.applyFilters(doc, combinedFilters))
      .map(doc => {
        let score = 0;
        
        // Text matching score
        if (toks.length > 0) {
          score = toks.reduce((s,t) => s + (doc.bag.includes(t) ? 1 : 0), 0);
          // Boost for title matches
          if (doc.title.toLowerCase().includes(textQuery.toLowerCase())) {
            score += 2;
          }
        } else {
          // If no text query, all filtered docs get base score
          score = 1;
        }
        
        // Boost for tag matches
        if (combinedFilters.tags.length > 0) {
          const matchingTags = combinedFilters.tags.filter(tag => 
            (doc.tags || []).includes(tag)
          ).length;
          score += matchingTags * 2;
        }
        
        return { id: doc.id, score };
      })
      .filter(r => r.score > 0)
      .sort((a,b) => b.score - a.score)
      .map(r => r.id);
    
    return results;
  },
  
  parseQuery(q){
    const textParts = [];
    const tagFilters = [];
    const dateFilters = {};
    const linkFilters = {};
    
    if (!q) {
      return { textQuery: '', tagFilters, dateFilters, linkFilters };
    }
    
    // Split query into tokens
    const tokens = q.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    
    tokens.forEach(token => {
      // Remove quotes from quoted phrases
      token = token.replace(/^"(.*)"$/, '$1');
      
      if (token.startsWith('tag:')) {
        // Tag filter
        const tag = token.substring(4);
        if (tag) tagFilters.push(tag.startsWith('#') ? tag : '#' + tag);
      } else if (token.startsWith('after:')) {
        // Date from filter
        const dateStr = token.substring(6);
        dateFilters.dateFrom = this.parseDate(dateStr);
      } else if (token.startsWith('before:')) {
        // Date to filter
        const dateStr = token.substring(7);
        dateFilters.dateTo = this.parseDate(dateStr);
      } else if (token.startsWith('links:>')) {
        // Minimum links filter
        const minLinks = parseInt(token.substring(7));
        if (!isNaN(minLinks)) linkFilters.minLinks = minLinks;
      } else if (token.startsWith('has:backlinks')) {
        // Backlinks filter
        linkFilters.hasBacklinks = true;
      } else {
        // Regular text token
        textParts.push(token);
      }
    });
    
    return {
      textQuery: textParts.join(' '),
      tagFilters,
      dateFilters,
      linkFilters
    };
  },
  
  parseDate(dateStr) {
    // Handle special date keywords
    const now = new Date();
    switch(dateStr.toLowerCase()) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo.toISOString().split('T')[0];
      default:
        // Try to parse as ISO date or return as-is
        return dateStr;
    }
  },
  
  applyFilters(doc, filters) {
    // Tag filters
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        (doc.tags || []).includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    
    // Date filters
    if (filters.dateFrom) {
      const docDate = (doc.updatedAt || doc.createdAt || '').split('T')[0];
      if (docDate < filters.dateFrom) return false;
    }
    
    if (filters.dateTo) {
      const docDate = (doc.updatedAt || doc.createdAt || '').split('T')[0];
      if (docDate > filters.dateTo) return false;
    }
    
    // Link filters
    if (filters.minLinks !== null) {
      if ((doc.links || []).length < filters.minLinks) return false;
    }
    
    if (filters.hasBacklinks) {
      if (doc.backlinkCount === 0) return false;
    }
    
    return true;
  },
  
  // Set filters for subsequent queries
  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
  },
  
  // Clear all filters
  clearFilters() {
    this.filters = {
      tags: [],
      dateFrom: null,
      dateTo: null,
      minLinks: null,
      hasBacklinks: false
    };
  },
  
  // Get filter summary for display
  getFilterSummary() {
    const parts = [];
    if (this.filters.tags.length > 0) {
      parts.push(`tags: ${this.filters.tags.join(', ')}`);
    }
    if (this.filters.dateFrom) {
      parts.push(`after: ${this.filters.dateFrom}`);
    }
    if (this.filters.dateTo) {
      parts.push(`before: ${this.filters.dateTo}`);
    }
    if (this.filters.minLinks !== null) {
      parts.push(`links: >${this.filters.minLinks}`);
    }
    if (this.filters.hasBacklinks) {
      parts.push('has:backlinks');
    }
    return parts.join(' ');
  }
};
