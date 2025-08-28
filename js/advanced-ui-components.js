/* Advanced UI Components */

// Toast notification system
const ToastManager = {
  show(message, type = 'success', duration = 3000) {
    const toast = el('#toast');
    if(!toast) return;
    
    // Set content and styling
    toast.textContent = message;
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transform translate-y-20 opacity-0 transition-all duration-300 z-50 ${this.getToastClasses(type)}`;
    
    // Show toast
    setTimeout(() => {
      toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);
    
    // Hide toast
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
    }, duration);
  },
  
  getToastClasses(type) {
    const classes = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-yellow-600 text-white',
      info: 'bg-blue-600 text-white'
    };
    return classes[type] || classes.success;
  }
};

// Enhanced loading states
const LoadingManager = {
  show(element, text = 'Loading...') {
    if(!element) return;
    
    element.classList.add('loading');
    element.setAttribute('data-original-text', element.textContent);
    element.textContent = text;
  },
  
  hide(element) {
    if(!element) return;
    
    element.classList.remove('loading');
    const originalText = element.getAttribute('data-original-text');
    if(originalText) {
      element.textContent = originalText;
      element.removeAttribute('data-original-text');
    }
  }
};

// Context menu system
const ContextMenu = {
  current: null,
  
  show(x, y, items) {
    this.hide();
    
    const menu = document.createElement('div');
    menu.className = 'fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 z-50';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    items.forEach(item => {
      if(item.separator) {
        const separator = document.createElement('div');
        separator.className = 'border-t border-gray-600 my-1';
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'px-4 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer flex items-center';
        menuItem.innerHTML = `
          ${item.icon ? `<i class="${item.icon} w-4 mr-2"></i>` : ''}
          <span>${item.label}</span>
          ${item.shortcut ? `<span class="ml-auto text-xs text-gray-400">${item.shortcut}</span>` : ''}
        `;
        menuItem.onclick = () => {
          if(item.action) item.action();
          this.hide();
        };
        menu.appendChild(menuItem);
      }
    });
    
    document.body.appendChild(menu);
    this.current = menu;
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this.hide.bind(this), { once: true });
    }, 10);
  },
  
  hide() {
    if(this.current) {
      this.current.remove();
      this.current = null;
    }
  }
};

// Tooltip system
const TooltipManager = {
  init() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  },
  
  handleMouseOver(e) {
    const element = e.target.closest('[title], [data-tooltip]');
    if(element) {
      const text = element.getAttribute('data-tooltip') || element.getAttribute('title');
      if(text) {
        element.removeAttribute('title'); // Prevent default tooltip
        this.show(element, text);
      }
    }
  },
  
  handleMouseOut(e) {
    this.hide();
  },
  
  show(element, text) {
    this.hide();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none';
    tooltip.textContent = text;
    tooltip.id = 'tooltip';
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    tooltip.style.left = (rect.left + rect.width / 2 - tooltipRect.width / 2) + 'px';
    tooltip.style.top = (rect.top - tooltipRect.height - 8) + 'px';
  },
  
  hide() {
    const tooltip = el('#tooltip');
    if(tooltip) tooltip.remove();
  }
};

// Progress bar component
const ProgressBar = {
  create(container, options = {}) {
    const {
      value = 0,
      max = 100,
      className = 'bg-blue-600',
      showText = true
    } = options;
    
    container.innerHTML = `
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div class="progress-bar ${className} h-2 rounded-full transition-all duration-300" style="width: ${(value/max)*100}%"></div>
      </div>
      ${showText ? `<div class="text-xs text-gray-400 mt-1">${value}/${max}</div>` : ''}
    `;
    
    return {
      update(newValue) {
        const bar = container.querySelector('.progress-bar');
        const text = container.querySelector('.text-xs');
        if(bar) bar.style.width = `${(newValue/max)*100}%`;
        if(text) text.textContent = `${newValue}/${max}`;
      }
    };
  }
};

// Advanced search UI
const AdvancedSearchUI = {
  init() {
    this.bindSearchFilters();
    this.initSearchSuggestions();
  },
  
  bindSearchFilters() {
    const searchInput = el('#advanced-search-input');
    if(searchInput) {
      searchInput.addEventListener('input', debounce(this.performSearch.bind(this), 300));
    }
    
    // Filter buttons
    els('#page-search button').forEach(btn => {
      if(btn.textContent.includes('All') || btn.textContent.includes('Title') || 
         btn.textContent.includes('Content') || btn.textContent.includes('Tags')) {
        btn.onclick = () => this.setSearchFilter(btn);
      }
    });
    
    // Color filter buttons
    els('#page-search .w-6.h-6.rounded-full').forEach(btn => {
      btn.onclick = () => this.setColorFilter(btn);
    });
  },
  
  setSearchFilter(button) {
    // Update button states
    const buttons = button.parentElement.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.className = btn.className.replace('bg-blue-600', 'bg-gray-700').replace('text-white', 'text-gray-300');
    });
    button.className = button.className.replace('bg-gray-700', 'bg-blue-600').replace('text-gray-300', 'text-white');
    
    this.performSearch();
  },
  
  setColorFilter(button) {
    button.classList.toggle('ring-2');
    button.classList.toggle('ring-blue-500');
    this.performSearch();
  },
  
  async performSearch() {
    const query = el('#advanced-search-input')?.value || '';
    const activeFilter = el('#page-search .bg-blue-600')?.textContent || 'All';
    const selectedColors = Array.from(els('#page-search .ring-blue-500')).map(btn => 
      btn.style.backgroundColor
    );
    
    if(!query && selectedColors.length === 0) {
      this.showSearchPlaceholder();
      return;
    }
    
    const results = await this.searchNotes(query, activeFilter, selectedColors);
    this.renderSearchResults(results);
  },
  
  async searchNotes(query, filter, colors) {
    const notes = await Store.allNotes();
    
    return notes.filter(note => {
      // Text filtering
      let textMatch = true;
      if(query) {
        const q = query.toLowerCase();
        switch(filter) {
          case 'Title Only':
            textMatch = note.title.toLowerCase().includes(q);
            break;
          case 'Content':
            textMatch = note.body.toLowerCase().includes(q);
            break;
          case 'Tags':
            textMatch = note.tags.some(tag => tag.toLowerCase().includes(q));
            break;
          default: // All
            textMatch = note.title.toLowerCase().includes(q) ||
                       note.body.toLowerCase().includes(q) ||
                       note.tags.some(tag => tag.toLowerCase().includes(q));
        }
      }
      
      // Color filtering
      let colorMatch = colors.length === 0 || colors.includes(note.color);
      
      return textMatch && colorMatch;
    });
  },
  
  renderSearchResults(results) {
    const container = el('#search-results');
    if(!container) return;
    
    if(results.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">No results found</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-white mb-2">Search Results (${results.length})</h3>
      </div>
      <div class="space-y-4">
        ${results.map(note => `
          <div class="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors" onclick="UI.openNoteFromSearch('${note.id}')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-white mb-2">${this.highlightText(note.title, el('#advanced-search-input')?.value)}</h4>
                <p class="text-gray-300 text-sm mb-3">${this.highlightText(note.body.slice(0, 150), el('#advanced-search-input')?.value)}${note.body.length > 150 ? '...' : ''}</p>
                ${note.tags.length > 0 ? `
                  <div class="flex gap-1 flex-wrap">
                    ${note.tags.map(tag => `<span class="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">${tag}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
              <div class="w-4 h-4 rounded-full ml-3 flex-shrink-0" style="background-color: ${note.color || '#6B7280'};"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  highlightText(text, query) {
    if(!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-500 text-black">$1</mark>');
  },
  
  showSearchPlaceholder() {
    const container = el('#search-results');
    if(container) {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">Enter a search term to see results</p>';
    }
  },
  
  initSearchSuggestions() {
    const input = el('#advanced-search-input');
    if(!input) return;
    
    // Add search suggestions functionality
    let suggestionsContainer;
    
    input.addEventListener('focus', () => {
      if(!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto z-10 hidden';
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(suggestionsContainer);
      }
    });
    
    input.addEventListener('input', debounce(async () => {
      if(!suggestionsContainer) return;
      
      const query = input.value.toLowerCase();
      if(query.length < 2) {
        suggestionsContainer.classList.add('hidden');
        return;
      }
      
      const suggestions = await this.getSuggestions(query);
      if(suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
          <div class="p-2 hover:bg-gray-700 cursor-pointer text-sm text-white" onclick="document.querySelector('#advanced-search-input').value='${suggestion}'; this.parentElement.classList.add('hidden'); AdvancedSearchUI.performSearch();">
            ${suggestion}
          </div>
        `).join('');
        suggestionsContainer.classList.remove('hidden');
      } else {
        suggestionsContainer.classList.add('hidden');
      }
    }, 200));
  },
  
  async getSuggestions(query) {
    const notes = await Store.allNotes();
    const suggestions = new Set();
    
    // Add tag suggestions
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if(tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });
    });
    
    // Add title word suggestions
    notes.forEach(note => {
      const words = note.title.split(' ');
      words.forEach(word => {
        if(word.toLowerCase().includes(query) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }
};

// Keyboard shortcuts help
const KeyboardShortcuts = {
  shortcuts: [
    { keys: '⌘/Ctrl + S', description: 'Save current note' },
    { keys: '⌘/Ctrl + N', description: 'Create new note' },
    { keys: '⌘/Ctrl + K', description: 'Quick search' },
    { keys: '⌘/Ctrl + P', description: 'Command palette' },
    { keys: '⌘/Ctrl + E', description: 'Go to Editor' },
    { keys: '⌘/Ctrl + G', description: 'Go to Graph' },
    { keys: '⌘/Ctrl + F', description: 'Go to Search' },
    { keys: '⌘/Ctrl + T', description: 'Go to Tags' },
    { keys: 'Escape', description: 'Close modals' }
  ],
  
  show() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-white">Keyboard Shortcuts</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="space-y-3">
          ${this.shortcuts.map(shortcut => `
            <div class="flex justify-between items-center">
              <kbd class="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">${shortcut.keys}</kbd>
              <span class="text-gray-300 text-sm">${shortcut.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.onclick = (e) => {
      if(e.target === modal) modal.remove();
    };
  }
};

// Status bar
const StatusBar = {
  init() {
    this.updateStatus();
    setInterval(() => this.updateStatus(), 10000); // Update every 10 seconds
  },
  
  async updateStatus() {
    const notes = await Store.allNotes();
    const syncStatus = el('#sync-status');
    const noteCounter = el('#note-counter');
    
    if(noteCounter) {
      noteCounter.textContent = `${notes.length} notes`;
    }
    
    if(syncStatus) {
      // Simulate sync status
      syncStatus.className = 'w-2 h-2 bg-green-500 rounded-full';
      syncStatus.title = 'Synced';
    }
  }
};

// Initialize advanced UI components
document.addEventListener('DOMContentLoaded', () => {
  TooltipManager.init();
  StatusBar.init();
  
  // Initialize advanced search if on search page
  if(window.location.hash === '#/search') {
    AdvancedSearchUI.init();
  }
  
  // Listen for page changes to reinitialize components
  window.addEventListener('hashchange', () => {
    if(window.location.hash === '#/search') {
      setTimeout(() => AdvancedSearchUI.init(), 100);
    }
  });
});

// Make components globally available
window.ToastManager = ToastManager;
window.LoadingManager = LoadingManager;
window.ContextMenu = ContextMenu;
window.AdvancedSearchUI = AdvancedSearchUI;
window.KeyboardShortcuts = KeyboardShortcuts;

// Override the global toast function
window.toast = (message, type) => ToastManager.show(message, type);

console.log('Advanced UI components loaded');
