/* advanced-search.js — Advanced search interface with query builder */

const AdvancedSearch = {
  // Search history
  searchHistory: [],
  
  // Saved searches
  savedSearches: [],
  
  // Initialize advanced search
  async init() {
    // Load search history and saved searches
    await this.loadSearchData();
    
    // Initialize UI
    this.initUI();
  },
  
  // Load search data from storage
  async loadSearchData() {
    try {
      this.searchHistory = await localforage.getItem('searchHistory') || [];
      this.savedSearches = await localforage.getItem('savedSearches') || [];
    } catch (error) {
      console.error('Failed to load search data:', error);
      this.searchHistory = [];
      this.savedSearches = [];
    }
  },
  
  // Save search data to storage
  async saveSearchData() {
    try {
      await localforage.setItem('searchHistory', this.searchHistory);
      await localforage.setItem('savedSearches', this.savedSearches);
    } catch (error) {
      console.error('Failed to save search data:', error);
    }
  },
  
  // Initialize UI components
  initUI() {
    // This will be called to initialize advanced search UI
  },
  
  // Show advanced search interface
  showAdvancedSearch() {
    // Create or show advanced search modal
    let searchModal = document.getElementById('advancedSearchModal');
    
    if (!searchModal) {
      searchModal = document.createElement('div');
      searchModal.id = 'advancedSearchModal';
      searchModal.className = 'modal';
      searchModal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="width: 800px; height: 80vh;">
          <div class="modal-header">
            <h2>Advanced Search</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body" style="display: flex; height: calc(100% - 60px);">
            <div class="search-sidebar" style="width: 250px; border-right: 1px solid #1f2434; padding: 16px;">
              <div class="search-section">
                <h3>Saved Searches</h3>
                <div id="savedSearchesList" class="saved-searches-list"></div>
                <button id="saveCurrentSearch" class="btn btn-small" style="width: 100%; margin-top: 8px;">Save Current Search</button>
              </div>
              <div class="search-section">
                <h3>Search History</h3>
                <div id="searchHistoryList" class="search-history-list"></div>
              </div>
            </div>
            <div class="search-main" style="flex: 1; padding: 16px; overflow: auto;">
              <div class="query-builder">
                <h3>Query Builder</h3>
                <div id="queryBuilder" class="query-builder-container"></div>
              </div>
              <div class="search-results">
                <h3>Results</h3>
                <div id="searchResults" class="search-results-container"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(searchModal);
      
      // Bind events
      const closeBtn = searchModal.querySelector('.modal-close');
      const overlay = searchModal.querySelector('.modal-overlay');
      
      const close = () => {
        searchModal.style.display = 'none';
      };
      
      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', close);
    }
    
    // Show modal
    searchModal.style.display = 'block';
    
    // Render components
    this.renderSavedSearches();
    this.renderSearchHistory();
    this.renderQueryBuilder();
  },
  
  // Render saved searches list
  renderSavedSearches() {
    const container = document.getElementById('savedSearchesList');
    if (!container) return;
    
    if (this.savedSearches.length === 0) {
      container.innerHTML = '<div class="no-saved-searches">No saved searches</div>';
      return;
    }
    
    container.innerHTML = this.savedSearches.map(search => `
      <div class="saved-search-item" data-id="${search.id}">
        <div class="saved-search-name">${search.name}</div>
        <div class="saved-search-query">${search.query}</div>
        <div class="saved-search-actions">
          <button class="btn btn-small" onclick="AdvancedSearch.loadSavedSearch('${search.id}')">Load</button>
          <button class="btn btn-small btn-danger" onclick="AdvancedSearch.deleteSavedSearch('${search.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  },
  
  // Render search history
  renderSearchHistory() {
    const container = document.getElementById('searchHistoryList');
    if (!container) return;
    
    if (this.searchHistory.length === 0) {
      container.innerHTML = '<div class="no-search-history">No search history</div>';
      return;
    }
    
    // Show last 10 searches
    const recentSearches = this.searchHistory.slice(-10).reverse();
    
    container.innerHTML = recentSearches.map(search => `
      <div class="search-history-item" onclick="AdvancedSearch.loadSearchHistory('${search.id}')">
        <div class="search-history-query">${search.query}</div>
        <div class="search-history-time">${new Date(search.timestamp).toLocaleString()}</div>
      </div>
    `).join('');
  },
  
  // Render query builder
  renderQueryBuilder() {
    const container = document.getElementById('queryBuilder');
    if (!container) return;
    
    container.innerHTML = `
      <div class="query-builder-ui">
        <div class="query-input-section">
          <label>Search Query</label>
          <textarea id="advancedQueryInput" class="form-control" rows="3" placeholder="Enter your search query..."></textarea>
          <div class="query-help">
            <small>Use SQL-like syntax: SELECT title, tags WHERE tags CONTAINS '#project' AND updatedAt > '2023-01-01'</small>
          </div>
        </div>
        
        <div class="query-builder-section">
          <h4>Build Query</h4>
          <div class="query-builder-controls">
            <div class="form-row">
              <div class="form-group">
                <label>Select Fields</label>
                <select id="selectFields" multiple class="form-control" style="height: 100px;">
                  <option value="id">ID</option>
                  <option value="title" selected>Title</option>
                  <option value="body">Body</option>
                  <option value="tags">Tags</option>
                  <option value="links">Links</option>
                  <option value="createdAt">Created At</option>
                  <option value="updatedAt">Updated At</option>
                  <option value="links_count">Links Count</option>
                  <option value="tags_count">Tags Count</option>
                  <option value="word_count">Word Count</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Conditions</label>
                <div id="queryConditions" class="query-conditions">
                  <div class="condition-row">
                    <select class="condition-field">
                      <option value="title">Title</option>
                      <option value="body">Body</option>
                      <option value="tags">Tags</option>
                      <option value="links">Links</option>
                      <option value="createdAt">Created At</option>
                      <option value="updatedAt">Updated At</option>
                      <option value="links_count">Links Count</option>
                      <option value="tags_count">Tags Count</option>
                    </select>
                    <select class="condition-operator">
                      <option value="CONTAINS">CONTAINS</option>
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value="<"><</option>
                      <option value="<="><=</option>
                      <option value=">">></option>
                      <option value=">=">>=</option>
                      <option value="LIKE">LIKE</option>
                    </select>
                    <input type="text" class="condition-value" placeholder="Value">
                    <button class="btn btn-small btn-danger remove-condition">-</button>
                  </div>
                </div>
                <button id="addCondition" class="btn btn-small">Add Condition</button>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Sort By</label>
                <select id="sortBy" class="form-control">
                  <option value="updatedAt">Updated At</option>
                  <option value="createdAt">Created At</option>
                  <option value="title">Title</option>
                  <option value="links_count">Links Count</option>
                  <option value="tags_count">Tags Count</option>
                </select>
                <select id="sortOrder" class="form-control">
                  <option value="DESC">Descending</option>
                  <option value="ASC">Ascending</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Limit Results</label>
                <input type="number" id="resultLimit" class="form-control" value="50" min="1" max="1000">
              </div>
            </div>
          </div>
        </div>
        
        <div class="query-actions">
          <button id="runAdvancedSearch" class="btn">Run Search</button>
          <button id="clearQuery" class="btn btn-secondary">Clear</button>
        </div>
      </div>
    `;
    
    // Bind events
    const addConditionBtn = container.querySelector('#addCondition');
    const runSearchBtn = container.querySelector('#runAdvancedSearch');
    const clearQueryBtn = container.querySelector('#clearQuery');
    const saveSearchBtn = document.getElementById('saveCurrentSearch');
    
    if (addConditionBtn) {
      addConditionBtn.addEventListener('click', () => this.addConditionRow());
    }
    
    if (runSearchBtn) {
      runSearchBtn.addEventListener('click', () => this.runAdvancedSearch());
    }
    
    if (clearQueryBtn) {
      clearQueryBtn.addEventListener('click', () => this.clearQueryBuilder());
    }
    
    if (saveSearchBtn) {
      saveSearchBtn.addEventListener('click', () => this.saveCurrentSearch());
    }
    
    // Bind remove condition buttons
    this.bindConditionEvents();
  },
  
  // Add condition row to query builder
  addConditionRow() {
    const container = document.getElementById('queryConditions');
    if (!container) return;
    
    const conditionRow = document.createElement('div');
    conditionRow.className = 'condition-row';
    conditionRow.innerHTML = `
      <select class="condition-field">
        <option value="title">Title</option>
        <option value="body">Body</option>
        <option value="tags">Tags</option>
        <option value="links">Links</option>
        <option value="createdAt">Created At</option>
        <option value="updatedAt">Updated At</option>
        <option value="links_count">Links Count</option>
        <option value="tags_count">Tags Count</option>
      </select>
      <select class="condition-operator">
        <option value="CONTAINS">CONTAINS</option>
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value="<"><</option>
        <option value="<="><=</option>
        <option value=">">></option>
        <option value=">=">>=</option>
        <option value="LIKE">LIKE</option>
      </select>
      <input type="text" class="condition-value" placeholder="Value">
      <button class="btn btn-small btn-danger remove-condition">-</button>
    `;
    
    container.appendChild(conditionRow);
    this.bindConditionEvents();
  },
  
  // Bind events for condition rows
  bindConditionEvents() {
    const container = document.getElementById('queryConditions');
    if (!container) return;
    
    // Bind remove condition buttons
    container.querySelectorAll('.remove-condition').forEach(button => {
      button.addEventListener('click', (e) => {
        e.target.closest('.condition-row').remove();
      });
    });
  },
  
  // Clear query builder
  clearQueryBuilder() {
    const queryInput = document.getElementById('advancedQueryInput');
    const conditionsContainer = document.getElementById('queryConditions');
    const sortBy = document.getElementById('sortBy');
    const sortOrder = document.getElementById('sortOrder');
    const resultLimit = document.getElementById('resultLimit');
    
    if (queryInput) queryInput.value = '';
    if (conditionsContainer) {
      conditionsContainer.innerHTML = `
        <div class="condition-row">
          <select class="condition-field">
            <option value="title">Title</option>
            <option value="body">Body</option>
            <option value="tags">Tags</option>
            <option value="links">Links</option>
            <option value="createdAt">Created At</option>
            <option value="updatedAt">Updated At</option>
            <option value="links_count">Links Count</option>
            <option value="tags_count">Tags Count</option>
          </select>
          <select class="condition-operator">
            <option value="CONTAINS">CONTAINS</option>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value="<"><</option>
            <option value="<="><=</option>
            <option value=">">></option>
            <option value=">=">>=</option>
            <option value="LIKE">LIKE</option>
          </select>
          <input type="text" class="condition-value" placeholder="Value">
          <button class="btn btn-small btn-danger remove-condition">-</button>
        </div>
      `;
      this.bindConditionEvents();
    }
    if (sortBy) sortBy.value = 'updatedAt';
    if (sortOrder) sortOrder.value = 'DESC';
    if (resultLimit) resultLimit.value = '50';
  },
  
  // Run advanced search
  async runAdvancedSearch() {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
    
    try {
      // Get search parameters
      const queryInput = document.getElementById('advancedQueryInput');
      const conditionsContainer = document.getElementById('queryConditions');
      const sortBy = document.getElementById('sortBy');
      const sortOrder = document.getElementById('sortOrder');
      const resultLimit = document.getElementById('resultLimit');
      
      let query = '';
      
      if (queryInput && queryInput.value.trim()) {
        // Use raw query input
        query = queryInput.value.trim();
      } else {
        // Build query from builder UI
        const fields = this.getSelectedFields();
        const conditions = this.getConditions();
        const sort = sortBy ? sortBy.value : 'updatedAt';
        const order = sortOrder ? sortOrder.value : 'DESC';
        const limit = resultLimit ? parseInt(resultLimit.value) : 50;
        
        query = this.buildQuery(fields, conditions, sort, order, limit);
      }
      
      // Save to history
      this.saveToHistory(query);
      
      // Execute search
      const notes = await Store.allNotes();
      const results = await QueryEngine.execute(query, notes);
      
      // Render results
      this.renderSearchResults(results);
    } catch (error) {
      console.error('Advanced search failed:', error);
      resultsContainer.innerHTML = `<div class="error">Search failed: ${error.message}</div>`;
    }
  },
  
  // Get selected fields from UI
  getSelectedFields() {
    const selectFields = document.getElementById('selectFields');
    if (!selectFields) return ['*'];
    
    const selected = Array.from(selectFields.selectedOptions).map(option => option.value);
    return selected.length > 0 ? selected : ['*'];
  },
  
  // Get conditions from UI
  getConditions() {
    const conditionsContainer = document.getElementById('queryConditions');
    if (!conditionsContainer) return [];
    
    const conditions = [];
    conditionsContainer.querySelectorAll('.condition-row').forEach(row => {
      const field = row.querySelector('.condition-field').value;
      const operator = row.querySelector('.condition-operator').value;
      const value = row.querySelector('.condition-value').value;
      
      if (value.trim()) {
        conditions.push({ field, operator, value: value.trim() });
      }
    });
    
    return conditions;
  },
  
  // Build query from parameters
  buildQuery(fields, conditions, sortBy, sortOrder, limit) {
    let query = `SELECT ${fields.join(', ')} `;
    
    if (conditions.length > 0) {
      query += 'WHERE ';
      const conditionStrings = conditions.map(cond => {
        // Handle different value types
        let value = cond.value;
        if (isNaN(value) && !value.includes("'") && !value.includes('"')) {
          value = `'${value}'`;
        }
        return `${cond.field} ${cond.operator} ${value}`;
      });
      query += conditionStrings.join(' AND ');
    }
    
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT ${limit}`;
    
    return query;
  },
  
  // Render search results
  renderSearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (results.length === 0) {
      container.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }
    
    container.innerHTML = `
      <div class="search-results-summary">
        Found ${results.length} results
      </div>
      <div class="search-results-list">
        ${results.map(result => this.renderResultItem(result)).join('')}
      </div>
    `;
  },
  
  // Render individual result item
  renderResultItem(result) {
    const title = result.title || result.id || 'Untitled';
    const body = result.body || '';
    const tags = result.tags || [];
    const createdAt = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '';
    const updatedAt = result.updatedAt ? new Date(result.updatedAt).toLocaleDateString() : '';
    
    return `
      <div class="search-result-item" onclick="UI.openNote('${result.id}')">
        <div class="result-header">
          <h4 class="result-title">${this.highlightText(title, this.getLastSearchQuery())}</h4>
          <div class="result-meta">
            ${createdAt ? `<span class="result-date">Created: ${createdAt}</span>` : ''}
            ${updatedAt ? `<span class="result-date">Updated: ${updatedAt}</span>` : ''}
          </div>
        </div>
        <div class="result-body">
          ${this.highlightText(this.truncateText(body, 200), this.getLastSearchQuery())}
        </div>
        <div class="result-tags">
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `;
  },
  
  // Highlight search terms in text
  highlightText(text, query) {
    if (!query || !text) return text;
    
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    let highlighted = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  },
  
  // Truncate text to specified length
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },
  
  // Save current search
  async saveCurrentSearch() {
    const queryInput = document.getElementById('advancedQueryInput');
    const query = queryInput ? queryInput.value.trim() : '';
    
    if (!query) {
      toast('Please enter a query to save');
      return;
    }
    
    const name = prompt('Enter a name for this search:');
    if (!name) return;
    
    const savedSearch = {
      id: ULID(),
      name: name,
      query: query,
      timestamp: new Date().toISOString()
    };
    
    this.savedSearches.push(savedSearch);
    await this.saveSearchData();
    this.renderSavedSearches();
    
    toast('Search saved successfully');
  },
  
  // Load saved search
  async loadSavedSearch(searchId) {
    const search = this.savedSearches.find(s => s.id === searchId);
    if (!search) return;
    
    const queryInput = document.getElementById('advancedQueryInput');
    if (queryInput) {
      queryInput.value = search.query;
    }
    
    toast(`Loaded search: ${search.name}`);
  },
  
  // Delete saved search
  async deleteSavedSearch(searchId) {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return;
    }
    
    this.savedSearches = this.savedSearches.filter(s => s.id !== searchId);
    await this.saveSearchData();
    this.renderSavedSearches();
    
    toast('Search deleted');
  },
  
  // Save to search history
  async saveToHistory(query) {
    const historyItem = {
      id: ULID(),
      query: query,
      timestamp: new Date().toISOString()
    };
    
    this.searchHistory.push(historyItem);
    
    // Keep only last 50 items
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(-50);
    }
    
    await this.saveSearchData();
    this.renderSearchHistory();
  },
  
  // Load search history
  async loadSearchHistory(searchId) {
    const historyItem = this.searchHistory.find(h => h.id === searchId);
    if (!historyItem) return;
    
    const queryInput = document.getElementById('advancedQueryInput');
    if (queryInput) {
      queryInput.value = historyItem.query;
    }
    
    // Run the search
    await this.runAdvancedSearch();
  },
  
  // Get last search query
  getLastSearchQuery() {
    if (this.searchHistory.length === 0) return '';
    return this.searchHistory[this.searchHistory.length - 1].query;
  },
  
  // Quick search with suggestions
  async quickSearch(query) {
    if (!query.trim()) return [];
    
    try {
      const notes = await Store.allNotes();
      const results = await QueryEngine.search(query, notes);
      return results.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Quick search failed:', error);
      return [];
    }
  },
  
  // Render quick search suggestions
  renderQuickSearchSuggestions(results, container) {
    if (!container) return;
    
    if (results.length === 0) {
      container.innerHTML = '<div class="no-suggestions">No suggestions</div>';
      return;
    }
    
    container.innerHTML = results.map(result => `
      <div class="search-suggestion" onclick="UI.openNote('${result.id}')">
        <div class="suggestion-title">${result.title || result.id}</div>
        <div class="suggestion-preview">${this.truncateText(result.body || '', 100)}</div>
      </div>
    `).join('');
  },
  
  // Search analytics
  async getSearchAnalytics() {
    const analytics = {
      totalSearches: this.searchHistory.length,
      popularTerms: {},
      savedSearchesCount: this.savedSearches.length,
      averageResultsPerSearch: 0
    };
    
    // Calculate popular search terms
    const termCounts = {};
    this.searchHistory.forEach(item => {
      const terms = item.query.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        if (term.length > 2) { // Ignore short terms
          termCounts[term] = (termCounts[term] || 0) + 1;
        }
      });
    });
    
    // Get top 10 terms
    analytics.popularTerms = Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [term, count]) => {
        obj[term] = count;
        return obj;
      }, {});
    
    return analytics;
  }
};