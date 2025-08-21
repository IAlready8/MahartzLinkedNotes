/* search.js — Performance optimized search for 1500+ notes */
const Search = {
  index: [],
  tagIndex: new Map(), // Tag-based index for fast tag filtering
  titleIndex: new Map(), // Title-based index for fast title searches
  linkIndex: new Map(), // Link-based index for relationship queries
  filters: {
    tags: [],
    dateFrom: null,
    dateTo: null,
    minLinks: null,
    hasBacklinks: false
  },
  
  // High-performance index building optimized for large datasets
  buildIndex(notes){
    const startTime = performance.now();
    
    // Clear existing indexes
    this.tagIndex.clear();
    this.titleIndex.clear(); 
    this.linkIndex.clear();
    
    // Skip rebuild if notes haven't changed significantly
    const notesHash = this.calculateNotesHash(notes);
    if (this.lastNotesHash === notesHash && this.index.length === notes.length) {
      console.log(`Index rebuild skipped - no changes detected`);
      return;
    }
    this.lastNotesHash = notesHash;
    
    // Build backlink map once for better performance
    const backlinkMap = new Map();
    notes.forEach(note => {
      (note.links || []).forEach(linkId => {
        backlinkMap.set(linkId, (backlinkMap.get(linkId) || 0) + 1);
      });
    });
    
    // Use batch processing for large datasets
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < notes.length; i += batchSize) {
      batches.push(notes.slice(i, i + batchSize));
    }
    
    this.index = [];
    
    // Process in batches to avoid blocking UI
    for (const batch of batches) {
      const batchResults = batch.map(n => {
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
          if (this.tokenCache.size > 1000) { // Increased cache size for large datasets
            const firstKey = this.tokenCache.keys().next().value;
            this.tokenCache.delete(firstKey);
          }
          this.tokenCache.set(cacheKey, bag);
        }
        
        const indexItem = { 
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
        
        // Build specialized indexes for faster querying
        this.buildSpecializedIndexes(indexItem);
        
        return indexItem;
      });
      
      this.index.push(...batchResults);
    }
    
    console.log(`Index built in ${(performance.now() - startTime).toFixed(2)}ms for ${notes.length} notes`);
  },
  
  // Build specialized indexes for O(1) lookups
  buildSpecializedIndexes(indexItem) {
    // Tag index - maps tags to note IDs
    indexItem.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(indexItem.id);
    });
    
    // Title index - for fast title-based searches
    const titleWords = tokenize(indexItem.title);
    titleWords.forEach(word => {
      if (!this.titleIndex.has(word)) {
        this.titleIndex.set(word, new Set());
      }
      this.titleIndex.get(word).add(indexItem.id);
    });
    
    // Link index - for relationship queries
    indexItem.links.forEach(linkId => {
      if (!this.linkIndex.has(linkId)) {
        this.linkIndex.set(linkId, new Set());
      }
      this.linkIndex.get(linkId).add(indexItem.id);
    });
  },
  
  query(q, filters = {}, maxResults = 100){
    const startTime = performance.now();
    
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
    
    // Fast path: if only tag filters, use tag index
    if (!textQuery && combinedFilters.tags.length > 0 && Object.keys(dateFilters).length === 0) {
      return this.fastTagQuery(combinedFilters.tags, combinedFilters, maxResults);
    }
    
    // Fast path: if only text query and no complex filters, use title index first
    if (textQuery && combinedFilters.tags.length === 0 && Object.keys(dateFilters).length === 0) {
      const titleResults = this.fastTitleQuery(textQuery, maxResults / 2);
      if (titleResults.length < maxResults) {
        const bodyResults = this.fastBodyQuery(textQuery, maxResults - titleResults.length);
        const combined = [...new Set([...titleResults, ...bodyResults])];
        console.log(`Fast query completed in ${(performance.now() - startTime).toFixed(2)}ms`);
        return combined.slice(0, maxResults);
      }
      console.log(`Fast title query completed in ${(performance.now() - startTime).toFixed(2)}ms`);
      return titleResults;
    }
    
    // Full search with scoring (slower but comprehensive)
    return this.fullTextQuery(textQuery, combinedFilters, maxResults, startTime);
  },
  
  // Fast tag-only search using tag index
  fastTagQuery(tags, filters, maxResults) {
    let candidateIds = new Set();
    
    // Get intersection of tag results
    if (tags.length === 1) {
      candidateIds = this.tagIndex.get(tags[0]) || new Set();
    } else {
      // Find intersection of all required tags
      const tagSets = tags.map(tag => this.tagIndex.get(tag) || new Set());
      candidateIds = tagSets.reduce((acc, set) => {
        return new Set([...acc].filter(id => set.has(id)));
      });
    }
    
    // Apply additional filters and return
    const results = Array.from(candidateIds).slice(0, maxResults);
    return this.applyAdditionalFilters(results, filters);
  },
  
  // Fast title-based search using title index
  fastTitleQuery(textQuery, maxResults) {
    const toks = uniq(tokenize(textQuery));
    const candidateIds = new Set();
    
    // Get candidates from title index
    toks.forEach(tok => {
      const titleMatches = this.titleIndex.get(tok);
      if (titleMatches) {
        titleMatches.forEach(id => candidateIds.add(id));
      }
    });
    
    // Score by title relevance
    const scored = Array.from(candidateIds).map(id => {
      const doc = this.index.find(d => d.id === id);
      let score = 0;
      
      if (doc) {
        // Exact title match gets highest score
        if (doc.title.toLowerCase() === textQuery.toLowerCase()) {
          score = 100;
        } else if (doc.title.toLowerCase().includes(textQuery.toLowerCase())) {
          score = 50;
        } else {
          // Count token matches in title
          score = toks.reduce((s, t) => {
            return s + (doc.title.toLowerCase().includes(t) ? 10 : 0);
          }, 0);
        }
      }
      
      return { id, score };
    });
    
    return scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(r => r.id);
  },
  
  // Fast body search with limited scope
  fastBodyQuery(textQuery, maxResults) {
    const toks = uniq(tokenize(textQuery));
    const results = [];
    
    // Search through index but with early termination
    for (let i = 0; i < this.index.length && results.length < maxResults * 2; i++) {
      const doc = this.index[i];
      let score = 0;
      
      // Quick bag check
      score = toks.reduce((s, t) => s + (doc.bag.includes(t) ? 1 : 0), 0);
      
      if (score > 0) {
        results.push({ id: doc.id, score });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(r => r.id);
  },
  
  // Full comprehensive search (fallback)
  fullTextQuery(textQuery, combinedFilters, maxResults, startTime) {
    const toks = uniq(tokenize(textQuery));
    
    // Pre-filter by tags if any specified (using tag index)
    let candidateIds = null;
    if (combinedFilters.tags.length > 0) {
      candidateIds = this.fastTagQuery(combinedFilters.tags, {}, Infinity);
    }
    
    // Filter and score documents
    let searchSpace = candidateIds ? 
      this.index.filter(doc => candidateIds.includes(doc.id)) : 
      this.index;
    
    let results = searchSpace
      .filter(doc => this.applyFilters(doc, combinedFilters))
      .map(doc => {
        let score = 0;
        
        // Text matching score
        if (toks.length > 0) {
          score = toks.reduce((s,t) => s + (doc.bag.includes(t) ? 1 : 0), 0);
          // Boost for title matches
          if (doc.title.toLowerCase().includes(textQuery.toLowerCase())) {
            score += 5;
          }
          // Boost for exact title match
          if (doc.title.toLowerCase() === textQuery.toLowerCase()) {
            score += 10;
          }
        } else {
          // If no text query, all filtered docs get base score
          score = 1;
        }
        
        // Quality signals
        score += Math.min(doc.backlinkCount, 5); // Boost for popular notes
        score += Math.min(doc.links.length, 3); // Boost for well-connected notes
        
        return { id: doc.id, score };
      })
      .filter(r => r.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0, maxResults)
      .map(r => r.id);
    
    console.log(`Full query completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    return results;
  },
  
  // Apply additional filters that can't use indexes
  applyAdditionalFilters(noteIds, filters) {
    if (Object.keys(filters).length === 0) return noteIds;
    
    return noteIds.filter(id => {
      const doc = this.index.find(d => d.id === id);
      return doc ? this.applyFilters(doc, filters) : false;
    });
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
  },
  
  // Get search performance statistics
  getSearchStats() {
    return {
      indexSize: this.index.length,
      tagIndexSize: this.tagIndex.size,
      titleIndexSize: this.titleIndex.size,
      linkIndexSize: this.linkIndex.size,
      cacheSize: this.tokenCache ? this.tokenCache.size : 0,
      memory: {
        indexMB: Math.round(JSON.stringify(this.index).length / 1024 / 1024 * 100) / 100,
        tagIndexMB: Math.round(JSON.stringify([...this.tagIndex]).length / 1024 / 1024 * 100) / 100
      }
    };
  },
  
  // Get search suggestions for autocomplete
  getSuggestions(query, maxSuggestions = 10) {
    if (!query || query.length < 2) return [];
    
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    // Title suggestions
    for (const doc of this.index) {
      if (doc.title.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'title',
          text: doc.title,
          id: doc.id,
          score: doc.title.toLowerCase().startsWith(lowerQuery) ? 10 : 5
        });
      }
    }
    
    // Tag suggestions
    for (const tag of this.tagIndex.keys()) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'tag',
          text: tag,
          count: this.tagIndex.get(tag).size,
          score: tag.toLowerCase().startsWith(lowerQuery) ? 8 : 3
        });
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  },
  
  // Advanced relationship queries
  findRelatedNotes(noteId, depth = 2, maxResults = 20) {
    const visited = new Set();
    const scores = new Map();
    const queue = [{ id: noteId, depth: 0, score: 10 }];
    
    while (queue.length > 0 && visited.size < maxResults * 2) {
      const { id, depth: currentDepth, score } = queue.shift();
      
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);
      
      if (id !== noteId) {
        scores.set(id, (scores.get(id) || 0) + score);
      }
      
      if (currentDepth < depth) {
        const doc = this.index.find(d => d.id === id);
        if (doc) {
          // Add linked notes
          doc.links.forEach(linkId => {
            if (!visited.has(linkId)) {
              queue.push({ id: linkId, depth: currentDepth + 1, score: score * 0.7 });
            }
          });
          
          // Add notes that link to this one
          const backlinks = this.linkIndex.get(id);
          if (backlinks) {
            backlinks.forEach(backlinkId => {
              if (!visited.has(backlinkId)) {
                queue.push({ id: backlinkId, depth: currentDepth + 1, score: score * 0.6 });
              }
            });
          }
          
          // Add notes with shared tags
          doc.tags.forEach(tag => {
            const taggedNotes = this.tagIndex.get(tag);
            if (taggedNotes) {
              taggedNotes.forEach(taggedNoteId => {
                if (!visited.has(taggedNoteId) && taggedNoteId !== id) {
                  queue.push({ id: taggedNoteId, depth: currentDepth + 1, score: score * 0.4 });
                }
              });
            }
          });
        }
      }
    }
    
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)
      .map(([id, score]) => ({ id, score: Math.round(score * 100) / 100 }));
  },
  
  // Calculate hash of notes for change detection
  calculateNotesHash(notes) {
    const hashInput = notes.map(n => `${n.id}:${n.updatedAt || n.createdAt}`).join('|');
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = ((hash << 5) - hash + hashInput.charCodeAt(i)) & 0xffffffff;
    }
    return hash;
  }
};
