// Modern App.js - Enhanced for Professional Dark Mode UI

const ModernApp = {
  state: {
    currentNoteId: null,
    notes: [],
    searchIndex: [],
    isLoading: false,
    currentPage: 'editor',
    previewMode: false,
    sidebarCollapsed: false
  },

  // Initialize the application
  async init() {
    console.log('🚀 Modern App initializing...');
    
    try {
      await this.initializeCore();
      await this.loadData();
      this.bindEvents();
      this.initializePages();
      this.finalizeStartup();
      
      console.log('✅ Modern App initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      UIEnhancements.showToast('Failed to initialize application', 'error');
    }
  },

  // Core initialization
  async initializeCore() {
    // Hide loading screen
    const loadingScreen = document.getElementById('app-loading');
    const appContainer = document.getElementById('app');
    
    if (loadingScreen && appContainer) {
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        appContainer.classList.remove('hidden');
      }, 800);
    }

    // Initialize broadcast channel for multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel('mahart-notes');
      this.bc.onmessage = this.handleSyncMessage.bind(this);
    }
  },

  // Load initial data
  async loadData() {
    try {
      if (typeof Store !== 'undefined') {
        this.state.notes = await Store.allNotes() || [];
        this.updateNoteCount();
        this.updateNoteList();
        
        if (this.state.notes.length > 0 && !this.state.currentNoteId) {
          await this.loadNote(this.state.notes[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  },

  // Bind all event listeners
  bindEvents() {
    // Navigation events
    this.bindNavigationEvents();
    
    // Editor events
    this.bindEditorEvents();
    
    // Search events
    this.bindSearchEvents();
    
    // Note list events
    this.bindNoteListEvents();
    
    // Global keyboard shortcuts
    this.bindKeyboardShortcuts();
  },

  // Navigation event handlers
  bindNavigationEvents() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route') || item.getAttribute('href');
        this.navigateTo(route);
      });
    });

    // New note button
    const newNoteBtn = document.getElementById('new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => this.createNewNote());
    }
  },

  // Editor event handlers
  bindEditorEvents() {
    // Title input
    const titleInput = document.getElementById('note-title');
    if (titleInput) {
      titleInput.addEventListener('input', this.debounce(() => {
        this.updateCurrentNote();
      }, 300));
    }

    // Body textarea
    const bodyTextarea = document.getElementById('note-body');
    if (bodyTextarea) {
      bodyTextarea.addEventListener('input', this.debounce(() => {
        this.updateCurrentNote();
        this.updatePreview();
      }, 300));
    }

    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentNote());
    }

    // Toolbar buttons
    this.bindToolbarEvents();

    // Preview toggle
    const previewToggle = document.getElementById('btn-toggle-preview');
    if (previewToggle) {
      previewToggle.addEventListener('click', () => this.togglePreview());
    }
  },

  // Toolbar event handlers
  bindToolbarEvents() {
    const toolbarButtons = {
      'btn-bold': () => this.insertMarkdown('**', '**', 'bold text'),
      'btn-italic': () => this.insertMarkdown('*', '*', 'italic text'),
      'btn-h1': () => this.insertMarkdown('# ', '', 'heading'),
      'btn-h2': () => this.insertMarkdown('## ', '', 'heading'),
      'btn-h3': () => this.insertMarkdown('### ', '', 'heading'),
      'btn-link': () => this.insertMarkdown('[', '](url)', 'link text'),
      'btn-wikilink': () => this.insertMarkdown('[[', ']]', 'Note Title'),
      'btn-check': () => this.insertMarkdown('- [ ] ', '', 'task item'),
      'btn-code': () => this.insertMarkdown('```\n', '\n```', 'code here'),
      'btn-quote': () => this.insertMarkdown('> ', '', 'quote text')
    };

    Object.entries(toolbarButtons).forEach(([id, handler]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', handler);
      }
    });
  },

  // Search event handlers
  bindSearchEvents() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
      searchInput.addEventListener('input', this.debounce((e) => {
        this.performSearch(e.target.value);
      }, 200));

      searchInput.addEventListener('focus', () => {
        if (searchResults) {
          searchResults.classList.remove('hidden');
        }
      });

      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          if (searchResults) {
            searchResults.classList.add('hidden');
          }
        }, 200);
      });
    }
  },

  // Note list event handlers
  bindNoteListEvents() {
    const noteList = document.getElementById('note-list');
    if (noteList) {
      noteList.addEventListener('click', (e) => {
        const noteItem = e.target.closest('.note-item');
        if (noteItem) {
          const noteId = noteItem.dataset.noteId;
          if (noteId) {
            this.loadNote(noteId);
          }
        }
      });
    }
  },

  // Keyboard shortcuts
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Handle via UIEnhancements which already has this covered
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            if (e.shiftKey) {
              e.preventDefault();
              // Command palette would go here
            }
            break;
          case 'enter':
            if (e.target.closest('.search-input')) {
              e.preventDefault();
              this.handleSearchEnter();
            }
            break;
        }
      }
    });
  },

  // Page initialization
  initializePages() {
    // Set initial page
    this.showPage('editor');
    
    // Update active navigation
    this.updateActiveNavigation('#/');
  },

  // Navigation
  navigateTo(route) {
    const pageMap = {
      '#/': 'editor',
      '#/graph': 'graph',
      '#/tags': 'tags',
      '#/ai': 'ai',
      '#/settings': 'settings'
    };

    const page = pageMap[route];
    if (page) {
      this.showPage(page);
      this.updateActiveNavigation(route);
      this.state.currentPage = page;
    }
  },

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Page-specific initialization
    this.initializePage(pageId);
  },

  initializePage(pageId) {
    switch (pageId) {
      case 'graph':
        this.initializeGraphPage();
        break;
      case 'tags':
        this.initializeTagsPage();
        break;
      case 'ai':
        this.initializeAIPage();
        break;
      case 'settings':
        this.initializeSettingsPage();
        break;
    }
  },

  updateActiveNavigation(route) {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.sidebar-nav-item[data-route="${route}"], .sidebar-nav-item[href="${route}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  },

  // Note Management
  async createNewNote() {
    if (typeof Store === 'undefined') return;

    try {
      const newNote = {
        id: this.generateId(),
        title: 'Untitled Note',
        body: '',
        tags: [],
        color: '#6B7280',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await Store.upsert(newNote);
      this.state.notes.unshift(newNote);
      await this.loadNote(newNote.id);
      this.updateNoteList();
      this.updateNoteCount();

      // Focus title input
      const titleInput = document.getElementById('note-title');
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }

      UIEnhancements.showToast('New note created', 'success');
    } catch (error) {
      console.error('Failed to create note:', error);
      UIEnhancements.showToast('Failed to create note', 'error');
    }
  },

  async loadNote(noteId) {
    if (!noteId || typeof Store === 'undefined') return;

    try {
      const note = await Store.get(noteId);
      if (!note) return;

      this.state.currentNoteId = noteId;

      // Update UI
      const titleInput = document.getElementById('note-title');
      const bodyTextarea = document.getElementById('note-body');

      if (titleInput) titleInput.value = note.title || '';
      if (bodyTextarea) bodyTextarea.value = note.body || '';

      this.updatePreview();
      this.updateActiveNoteInList(noteId);
      this.updateSaveStatus('saved');

    } catch (error) {
      console.error('Failed to load note:', error);
      UIEnhancements.showToast('Failed to load note', 'error');
    }
  },

  async updateCurrentNote() {
    if (!this.state.currentNoteId || typeof Store === 'undefined') return;

    try {
      const titleInput = document.getElementById('note-title');
      const bodyTextarea = document.getElementById('note-body');

      if (!titleInput || !bodyTextarea) return;

      const note = await Store.get(this.state.currentNoteId);
      if (!note) return;

      note.title = titleInput.value || 'Untitled Note';
      note.body = bodyTextarea.value || '';
      note.updatedAt = new Date().toISOString();

      // Update in memory
      const noteIndex = this.state.notes.findIndex(n => n.id === this.state.currentNoteId);
      if (noteIndex !== -1) {
        this.state.notes[noteIndex] = { ...note };
        this.updateNoteList();
      }

      this.updateSaveStatus('modified');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  },

  async saveCurrentNote() {
    if (!this.state.currentNoteId || typeof Store === 'undefined') return;

    try {
      this.updateSaveStatus('saving');

      const titleInput = document.getElementById('note-title');
      const bodyTextarea = document.getElementById('note-body');

      if (!titleInput || !bodyTextarea) return;

      const note = await Store.get(this.state.currentNoteId);
      if (!note) return;

      note.title = titleInput.value || 'Untitled Note';
      note.body = bodyTextarea.value || '';
      note.updatedAt = new Date().toISOString();

      await Store.upsert(note);
      
      // Update in memory
      const noteIndex = this.state.notes.findIndex(n => n.id === this.state.currentNoteId);
      if (noteIndex !== -1) {
        this.state.notes[noteIndex] = { ...note };
        this.updateNoteList();
      }

      this.updateSaveStatus('saved');
      UIEnhancements.showToast('Note saved', 'success');

      // Broadcast sync message
      if (this.bc) {
        this.bc.postMessage({ type: 'sync', noteId: this.state.currentNoteId });
      }

    } catch (error) {
      console.error('Failed to save note:', error);
      this.updateSaveStatus('error');
      UIEnhancements.showToast('Failed to save note', 'error');
    }
  },

  // UI Updates
  updateNoteCount() {
    const noteCount = document.getElementById('note-count');
    if (noteCount) {
      const count = this.state.notes.length;
      noteCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;
    }
  },

  updateNoteList() {
    const noteList = document.getElementById('note-list');
    if (!noteList) return;

    noteList.innerHTML = '';

    this.state.notes.forEach(note => {
      const noteItem = this.createNoteItem(note);
      noteList.appendChild(noteItem);
    });
  },

  createNoteItem(note) {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.dataset.noteId = note.id;
    
    if (note.id === this.state.currentNoteId) {
      item.classList.add('active');
    }

    const preview = note.body ? note.body.substring(0, 100) + '...' : 'No content';
    
    item.innerHTML = `
      <div class="note-color-dot" style="background-color: ${note.color || '#6B7280'};"></div>
      <div class="note-content">
        <div class="note-title">${note.title || 'Untitled'}</div>
        <div class="note-preview">${preview}</div>
      </div>
    `;

    return item;
  },

  updateActiveNoteInList(noteId) {
    document.querySelectorAll('.note-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.note-item[data-note-id="${noteId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  },

  updateSaveStatus(status) {
    const saveStatus = document.getElementById('save-status');
    const saveBtn = document.getElementById('save-btn');
    
    if (!saveStatus) return;

    const statusMap = {
      'saved': { text: 'Saved', class: 'text-success' },
      'modified': { text: 'Modified', class: 'text-warning' },
      'saving': { text: 'Saving...', class: 'text-accent' },
      'error': { text: 'Error', class: 'text-error' }
    };

    const statusInfo = statusMap[status] || statusMap.saved;
    saveStatus.textContent = statusInfo.text;
    saveStatus.className = `save-status ${statusInfo.class}`;

    if (saveBtn) {
      saveBtn.disabled = status === 'saving';
    }
  },

  updatePreview() {
    if (!this.state.previewMode) return;

    const bodyTextarea = document.getElementById('note-body');
    const preview = document.getElementById('note-preview');
    
    if (!bodyTextarea || !preview) return;

    const content = bodyTextarea.value;
    if (typeof marked !== 'undefined') {
      preview.innerHTML = DOMPurify.sanitize(marked.parse(content));
    } else {
      preview.textContent = content;
    }
  },

  // Editor Functions
  insertMarkdown(before, after, placeholder) {
    const textarea = document.getElementById('note-body');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = selectedText || placeholder;
    const newText = before + replacement + after;
    
    textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    
    // Set cursor position
    const newCursorPos = start + before.length + replacement.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    
    this.updateCurrentNote();
    this.updatePreview();
  },

  togglePreview() {
    this.state.previewMode = !this.state.previewMode;
    
    const previewPanel = document.getElementById('preview-panel');
    const previewToggle = document.getElementById('btn-toggle-preview');
    
    if (previewPanel) {
      if (this.state.previewMode) {
        previewPanel.style.display = 'block';
        this.updatePreview();
      } else {
        previewPanel.style.display = 'none';
      }
    }
    
    if (previewToggle) {
      previewToggle.classList.toggle('active', this.state.previewMode);
    }
  },

  // Search
  async performSearch(query) {
    if (!query.trim()) {
      this.hideSearchResults();
      return;
    }

    if (typeof Search !== 'undefined') {
      const results = await Search.search(query);
      this.displaySearchResults(results, query);
    }
  },

  displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    searchResults.innerHTML = '';
    searchResults.classList.remove('hidden');

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.cssText = 'padding: var(--space-md); color: var(--color-text-muted); text-align: center;';
      noResults.textContent = 'No results found';
      searchResults.appendChild(noResults);
      return;
    }

    results.slice(0, 8).forEach(result => {
      const item = document.createElement('div');
      item.style.cssText = 'padding: var(--space-sm) var(--space-md); cursor: pointer; border-bottom: 1px solid var(--color-border-primary);';
      item.innerHTML = `
        <div style="font-weight: var(--font-weight-medium); color: var(--color-text-primary); margin-bottom: 2px;">${this.highlightQuery(result.title, query)}</div>
        <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: var(--line-height-tight);">${this.highlightQuery(result.preview || '', query)}</div>
      `;
      
      item.addEventListener('click', () => {
        this.loadNote(result.id);
        this.hideSearchResults();
        document.getElementById('search-input').value = '';
      });
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = 'var(--color-bg-hover)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });
      
      searchResults.appendChild(item);
    });
  },

  highlightQuery(text, query) {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--color-accent-primary); color: white; padding: 2px 4px; border-radius: 2px;">$1</mark>');
  },

  hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
      searchResults.classList.add('hidden');
    }
  },

  handleSearchEnter() {
    const searchResults = document.getElementById('search-results');
    if (searchResults && !searchResults.classList.contains('hidden')) {
      const firstResult = searchResults.querySelector('[data-note-id]');
      if (firstResult) {
        firstResult.click();
      }
    }
  },

  // Page Initializers
  initializeGraphPage() {
    if (typeof Graph !== 'undefined') {
      setTimeout(() => {
        Graph.render(this.state.notes);
      }, 100);
    }
  },

  initializeTagsPage() {
    if (typeof TagManager !== 'undefined') {
      TagManager.renderTagsPage(this.state.notes);
    }
  },

  initializeAIPage() {
    // AI page initialization would go here
    console.log('AI page initialized');
  },

  initializeSettingsPage() {
    // Settings page is already handled by UIEnhancements
    console.log('Settings page initialized');
  },

  // Sync handling
  handleSyncMessage(event) {
    if (event.data?.type === 'sync') {
      this.loadData();
    }
  },

  // Finalize startup
  finalizeStartup() {
    // Set app as ready
    const appReady = document.getElementById('app-ready');
    if (appReady) {
      appReady.style.display = 'block';
    }

    // Show welcome message
    UIEnhancements.showToast('Welcome to Mahart Notes', 'success');
  },

  // Utility functions
  generateId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

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
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ModernApp.init());
} else {
  ModernApp.init();
}