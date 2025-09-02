/* app.js — MODULARIZED FOR ROUTER */

// 👑 Guide: The UI object is now structured around pages. 
// Each page has its own init function to load resources on demand.
const UI = {
  state: { currentId: null, autoLink: true, analytics: true, bc: true },
  bc: null,

  // ✅ Fixed: The main init is now lean. It sets up the router and global handlers.
  async init() {
    console.log('App shell initializing...');
    this.bindGlobalHandlers();
    this.setupRouter();
    initRouter(); // This function is from router.js

    if (this.state.bc) {
      this.bc = new BroadcastChannel('mahart-notes');
      this.bc.onmessage = async (e) => { if (e.data?.type === 'sync') { await this.refreshCurrentPage(); } };
    }
  },

  // 🗺️ Plan: Define all pages and their onLoad handlers for the router.
  setupRouter() {
    // Core Pages
    definePage('#/', {
      pageId: 'page-home',
      onLoad: this.initHomePage.bind(this)
    });
    definePage('#/graph', {
      pageId: 'page-graph',
      onLoad: this.initGraphPage.bind(this)
    });
    definePage('#/search', {
      pageId: 'page-search',
      onLoad: this.initSearchPage.bind(this)
    });
    definePage('#/tags', {
      pageId: 'page-tags',
      onLoad: this.initTagsPage.bind(this)
    });

    // Analytics & Insights
    definePage('#/analytics', {
      pageId: 'page-analytics',
      onLoad: this.initAnalyticsPage.bind(this)
    });
    definePage('#/insights', {
      pageId: 'page-insights',
      onLoad: this.initInsightsPage.bind(this)
    });
    definePage('#/timeline', {
      pageId: 'page-timeline',
      onLoad: this.initTimelinePage.bind(this)
    });

    // Tools & Productivity
    definePage('#/templates', {
      pageId: 'page-templates',
      onLoad: this.initTemplatesPage.bind(this)
    });
    definePage('#/presentations', {
      pageId: 'page-presentations',
      onLoad: this.initPresentationsPage.bind(this)
    });
    definePage('#/export', {
      pageId: 'page-export',
      onLoad: this.initExportPage.bind(this)
    });
    definePage('#/backup', {
      pageId: 'page-backup',
      onLoad: this.initBackupPage.bind(this)
    });

    // AI & Automation
    definePage('#/ai', {
      pageId: 'page-ai',
      onLoad: this.initAiPage.bind(this)
    });
    definePage('#/recommendations', {
      pageId: 'page-recommendations',
      onLoad: this.initRecommendationsPage.bind(this)
    });
    definePage('#/learning', {
      pageId: 'page-learning',
      onLoad: this.initLearningPage.bind(this)
    });

    // System & Settings
    definePage('#/workspace', {
      pageId: 'page-workspace',
      onLoad: this.initWorkspacePage.bind(this)
    });
    definePage('#/themes', {
      pageId: 'page-themes',
      onLoad: this.initThemesPage.bind(this)
    });
    definePage('#/plugins', {
      pageId: 'page-plugins',
      onLoad: this.initPluginsPage.bind(this)
    });
    definePage('#/settings', {
      pageId: 'page-settings',
      onLoad: this.initSettingsPage.bind(this)
    });
  },

  // --- PAGE INITIALIZERS ---

  async initHomePage() {
    console.log('Initializing Home Page...');
    this.bindHomePageEvents();
    const notes = await Store.allNotes();
    if (!notes.length) {
        await this.seed();
        await this.refreshHomePage();
        await this.openNote((await Store.allNotes())[0].id, true);
    } else {
        await this.refreshHomePage();
        const lastId = localStorage.getItem('lastOpenNoteId');
        if(lastId) {
            await this.openNote(lastId, true);
        }
    }
  },

  async initGraphPage() {
    console.log('Initializing Graph Page...');
    this.bindGraphPageEvents();
    await this.renderGraph();
  },

  bindGraphPageEvents() {
    const linkByTags = el('#linkByTags');
    const linkByColors = el('#linkByColors');

    if(linkByTags) {
      linkByTags.onclick = () => {
        this.setGraphLinkMode('tags');
        this.renderGraph();
      };
    }

    if(linkByColors) {
      linkByColors.onclick = () => {
        this.setGraphLinkMode('colors');
        this.renderGraph();
      };
    }
  },

  setGraphLinkMode(mode) {
    this.state.graphLinkMode = mode;
    localStorage.setItem('graphLinkMode', mode);

    // Update button styles
    const linkByTags = el('#linkByTags');
    const linkByColors = el('#linkByColors');

    if(mode === 'tags') {
      if(linkByTags) {
        linkByTags.className = 'px-3 py-1 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors';
      }
      if(linkByColors) {
        linkByColors.className = 'px-3 py-1 rounded text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors';
      }
    } else {
      if(linkByTags) {
        linkByTags.className = 'px-3 py-1 rounded text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors';
      }
      if(linkByColors) {
        linkByColors.className = 'px-3 py-1 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors';
      }
    }
  },

  async renderGraph() {
    const notes = await Store.allNotes();
    const graphContainer = el('#graphContainer');
    
    if (!graphContainer) return;

    // Initialize graph link mode from storage
    if (!this.state.graphLinkMode) {
      this.state.graphLinkMode = localStorage.getItem('graphLinkMode') || 'tags';
      this.setGraphLinkMode(this.state.graphLinkMode);
    }

    if (typeof Graph !== 'undefined') {
        const linkMode = this.state.graphLinkMode || 'tags';
        Graph.render(graphContainer, notes, { linkMode });
    } else {
        graphContainer.innerHTML = '<p class="text-center text-gray-400">Graph library not loaded or container not found.</p>';
    }
  },

  async initTagsPage() {
    console.log('Initializing Tags Page...');
    this.bindTagsPageEvents();
    await this.renderTagManager();
  },

  initAiPage() {
    console.log('Initializing AI Page...');
    const container = el('#page-ai .bg-gray-800');
    if (container) {
        container.innerHTML = '<p class="text-center text-gray-400">The AI Assistant module would be rendered here.</p>';
    }
  },

  initSettingsPage() {
    console.log('Initializing Settings Page...');
    this.bindSettingsPageEvents();
  },

  // --- ADDITIONAL PAGE INITIALIZERS ---

  initSearchPage() {
    console.log('Initializing Search Page...');
    this.bindAdvancedSearchEvents();
    if (typeof AdvancedSearch !== 'undefined') {
      AdvancedSearch.init();
    }
  },

  initAnalyticsPage() {
    console.log('Initializing Analytics Page...');
    this.bindAnalyticsPageEvents();
    this.loadAnalyticsDashboard();
  },

  initInsightsPage() {
    console.log('Initializing Insights Page...');
    this.loadKnowledgeInsights();
  },

  initTimelinePage() {
    console.log('Initializing Timeline Page...');
    this.bindTimelinePageEvents();
    this.loadKnowledgeTimeline();
  },

  initTemplatesPage() {
    console.log('Initializing Templates Page...');
    this.bindTemplatesPageEvents();
    if (typeof SmartTemplates !== 'undefined') {
      SmartTemplates.init();
    }
  },

  initPresentationsPage() {
    console.log('Initializing Presentations Page...');
    this.bindPresentationsPageEvents();
    if (typeof PresentationGenerator !== 'undefined') {
      PresentationGenerator.init();
    }
  },

  initExportPage() {
    console.log('Initializing Export Page...');
    this.bindExportPageEvents();
    if (typeof DataManagement !== 'undefined') {
      DataManagement.loadExportOptions();
    }
  },

  initBackupPage() {
    console.log('Initializing Backup Page...');
    this.bindBackupPageEvents();
    if (typeof DataManagement !== 'undefined') {
      DataManagement.loadBackupOptions();
    }
  },

  initRecommendationsPage() {
    console.log('Initializing Recommendations Page...');
    this.bindRecommendationsPageEvents();
    if (typeof Recommendations !== 'undefined') {
      Recommendations.loadSuggestions();
    }
  },

  initLearningPage() {
    console.log('Initializing Learning Page...');
    this.bindLearningPageEvents();
    if (typeof LearningMode !== 'undefined') {
      LearningMode.init();
    }
  },

  initWorkspacePage() {
    console.log('Initializing Workspace Page...');
    this.bindWorkspacePageEvents();
    if (typeof WorkspaceManager !== 'undefined') {
      WorkspaceManager.init();
    }
  },

  initThemesPage() {
    console.log('Initializing Themes Page...');
    this.bindThemesPageEvents();
    if (typeof ThemeManager !== 'undefined') {
      ThemeManager.loadThemes();
    }
  },

  initPluginsPage() {
    console.log('Initializing Plugins Page...');
    this.bindPluginsPageEvents();
    if (typeof PluginSystem !== 'undefined') {
      PluginSystem.loadPlugins();
    }
  },

  // --- EVENT BINDING ---

  bindGlobalHandlers() {
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { 
        e.preventDefault(); 
        if(window.location.hash === '#/' || window.location.hash === ''){
            this.save(); 
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggleQuickSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.createNewNote();
      }
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });

    // Sidebar functionality
    const sidebarSearch = el('#sidebar-search');
    const commandPaletteBtn = el('#command-palette-btn');
    const newNoteBtn = el('#new-note-btn');
    const sidebarCollapse = el('#sidebar-collapse');

    if (sidebarSearch) {
      sidebarSearch.onclick = () => this.toggleQuickSearch();
    }
    
    if (commandPaletteBtn) {
      commandPaletteBtn.onclick = () => this.toggleCommandPalette();
    }
    
    if (newNoteBtn) {
      newNoteBtn.onclick = () => this.createNewNote();
    }

    if (sidebarCollapse) {
      sidebarCollapse.onclick = () => this.toggleSidebar();
    }

    // Quick search modal functionality
    this.setupQuickSearch();
    this.setupCommandPalette();

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.id === 'quick-search-modal' || e.target.id === 'command-palette-modal') {
        this.closeModals();
      }
    });
  },

  setupQuickSearch() {
    const modal = el('#quick-search-modal');
    const input = el('#quick-search-input');
    const results = el('#quick-search-results');

    if (input) {
      input.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (!query) {
          results.innerHTML = '<div class="p-4 text-gray-400 text-center">Start typing to search...</div>';
          return;
        }

        const notes = await Store.allNotes();
        const filtered = notes.filter(note => 
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.body.toLowerCase().includes(query.toLowerCase()) ||
          note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        if (filtered.length === 0) {
          results.innerHTML = '<div class="p-4 text-gray-400 text-center">No results found</div>';
          return;
        }

        const html = filtered.slice(0, 10).map(note => `
          <div class="p-3 hover:bg-gray-700 rounded cursor-pointer border-b border-gray-700" onclick="UI.openNoteFromQuickSearch('${note.id}')">
            <div class="flex items-center">
              <i class="fas fa-file-alt text-blue-500 mr-3"></i>
              <div>
                <div class="font-medium text-white">${note.title}</div>
                <div class="text-gray-400 text-sm">${note.body.substring(0, 80)}...</div>
              </div>
            </div>
          </div>
        `).join('');

        results.innerHTML = html;
      }, 200));

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const firstResult = results.querySelector('[onclick]');
          if (firstResult) {
            firstResult.click();
          }
        }
      });
    }
  },

  setupCommandPalette() {
    const input = el('#command-palette-input');
    const results = el('#command-palette-results');

    if (input) {
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const commands = [
          { name: 'New Note', icon: 'fas fa-plus', action: 'createNewNote', shortcut: '⌘N' },
          { name: 'Quick Search', icon: 'fas fa-search', action: 'toggleQuickSearch', shortcut: '⌘K' },
          { name: 'Export All Notes', icon: 'fas fa-download', action: 'exportJSON', shortcut: '' },
          { name: 'Open Graph', icon: 'fas fa-project-diagram', action: 'openGraph', shortcut: '' },
          { name: 'Open Analytics', icon: 'fas fa-chart-line', action: 'openAnalytics', shortcut: '' },
          { name: 'Open Settings', icon: 'fas fa-cog', action: 'openSettings', shortcut: '' }
        ];

        const filtered = commands.filter(cmd => 
          cmd.name.toLowerCase().includes(query)
        );

        const html = filtered.map(cmd => `
          <div class="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center" onclick="UI.executeCommand('${cmd.action}')">
            <i class="${cmd.icon} w-6 mr-3 text-blue-500"></i>
            <span class="text-white flex-grow">${cmd.name}</span>
            ${cmd.shortcut ? `<kbd class="ml-auto text-xs bg-gray-700 px-2 py-1 rounded">${cmd.shortcut}</kbd>` : ''}
          </div>
        `).join('');

        results.innerHTML = `<div class="p-4"><div class="space-y-2">${html}</div></div>`;
      });
    }
  },

  toggleQuickSearch() {
    const modal = el('#quick-search-modal');
    const input = el('#quick-search-input');
    
    if (modal.classList.contains('hidden')) {
      this.closeModals();
      modal.classList.remove('hidden');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    } else {
      modal.classList.add('hidden');
    }
  },

  toggleCommandPalette() {
    const modal = el('#command-palette-modal');
    const input = el('#command-palette-input');
    
    if (modal.classList.contains('hidden')) {
      this.closeModals();
      modal.classList.remove('hidden');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    } else {
      modal.classList.add('hidden');
    }
  },

  closeModals() {
    const quickSearch = el('#quick-search-modal');
    const commandPalette = el('#command-palette-modal');
    
    if (quickSearch) quickSearch.classList.add('hidden');
    if (commandPalette) commandPalette.classList.add('hidden');
  },

  openNoteFromQuickSearch(noteId) {
    this.closeModals();
    window.location.hash = '#/';
    setTimeout(() => this.openNote(noteId), 100);
  },

  executeCommand(action) {
    this.closeModals();
    
    switch(action) {
      case 'createNewNote':
        this.createNewNote();
        break;
      case 'toggleQuickSearch':
        this.toggleQuickSearch();
        break;
      case 'exportJSON':
        this.exportJSON();
        break;
      case 'openGraph':
        window.location.hash = '#/graph';
        break;
      case 'openAnalytics':
        window.location.hash = '#/analytics';
        break;
      case 'openSettings':
        window.location.hash = '#/settings';
        break;
      default:
        console.log(`Unknown command: ${action}`);
    }
  },

  async createNewNote() {
    window.location.hash = '#/';
    await this.refreshHomePage();
    const titleInput = el('#title');
    const editor = el('#note-body');
    
    if (titleInput) {
      titleInput.value = '';
      titleInput.focus();
    }
    if (editor) {
      editor.value = '';
    }
    
    this.state.currentId = null;
    const dirty = el('#dirty');
    if (dirty) dirty.classList.add('hidden');
  },

  toggleSidebar() {
    const sidebar = el('#main-sidebar');
    const collapseBtn = el('#sidebar-collapse');
    const collapseIcon = collapseBtn?.querySelector('i');
    
    if (sidebar.style.width === '48px' || sidebar.classList.contains('collapsed')) {
      // Expand
      sidebar.style.width = '208px';
      sidebar.classList.remove('collapsed');
      if (collapseIcon) collapseIcon.className = 'fas fa-chevron-left text-xs';
    } else {
      // Collapse
      sidebar.style.width = '48px';
      sidebar.classList.add('collapsed');
      if (collapseIcon) collapseIcon.className = 'fas fa-chevron-right text-xs';
    }
  },

  bindHomePageEvents() {
    const saveBtn = el('#saveNoteInline');
    const editor = el('#note-body');
    const title = el('#note-title');
    
    if(saveBtn) saveBtn.onclick = () => this.save();
    if(editor) {
      editor.addEventListener('input', debounce(() => {
        const dirty = el('#dirty');
        if(dirty) dirty.classList.remove('hidden');
        this.renderPreviewLive();
      }, 250));
      
      // Add keyboard shortcuts for common markdown formatting
      editor.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch(e.key) {
            case 'b':
              e.preventDefault();
              this.insertMarkdownFormat('**', '**', 'Bold text');
              break;
            case 'i':
              e.preventDefault();
              this.insertMarkdownFormat('*', '*', 'Italic text');
              break;
            case 'k':
              e.preventDefault();
              this.insertMarkdownFormat('[[', ']]', 'Note Title');
              break;
            case 'h':
              e.preventDefault();
              this.addHighlight();
              break;
          }
        }
      });
    }
    if(title) {
      title.addEventListener('input', () => { 
        const dirty = el('#dirty');
        if(dirty) dirty.classList.remove('hidden');
      });
    }

    // Color picker functionality
    this.bindColorPicker();
  },

  bindColorPicker() {
    const colorButton = el('#noteColorButton');
    const colorMenu = el('#colorPickerMenu');
    const colorOptions = els('.color-option');

    if(colorButton) {
      colorButton.onclick = (e) => {
        e.stopPropagation();
        colorMenu.classList.toggle('hidden');
      };
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!colorMenu.contains(e.target) && !colorButton.contains(e.target)) {
        colorMenu.classList.add('hidden');
      }
    });

    // Handle color selection
    colorOptions.forEach(option => {
      option.onclick = (e) => {
        e.stopPropagation();
        const newColor = option.dataset.color;
        this.setNoteColor(newColor);
        colorMenu.classList.add('hidden');
      };
    });

    // Bind toolbar buttons
    this.bindToolbarButtons();
  },

  // Bind all toolbar buttons for formatting
  bindToolbarButtons() {
    const boldBtn = el('#btn-bold');
    const italicBtn = el('#btn-italic');
    const h1Btn = el('#btn-h1');
    const h2Btn = el('#btn-h2');
    const h3Btn = el('#btn-h3');
    const linkBtn = el('#btn-link');
    const wikilinkBtn = el('#btn-wikilink');
    const checkBtn = el('#btn-check');
    const codeBtn = el('#btn-code');
    const quoteBtn = el('#btn-quote');
    const highlightBtn = el('#btn-highlight');
    const previewBtn = el('#btn-toggle-preview');

    if (boldBtn) boldBtn.onclick = () => this.insertMarkdownFormat('**', '**', 'Bold text');
    if (italicBtn) italicBtn.onclick = () => this.insertMarkdownFormat('*', '*', 'Italic text');
    if (h1Btn) h1Btn.onclick = () => this.insertMarkdownFormat('# ', '', 'Heading 1');
    if (h2Btn) h2Btn.onclick = () => this.insertMarkdownFormat('## ', '', 'Heading 2');
    if (h3Btn) h3Btn.onclick = () => this.insertMarkdownFormat('### ', '', 'Heading 3');
    if (linkBtn) linkBtn.onclick = () => this.insertMarkdownFormat('[', '](https://example.com)', 'Link text');
    if (wikilinkBtn) wikilinkBtn.onclick = () => this.insertMarkdownFormat('[[', ']]', 'Note Title');
    if (checkBtn) checkBtn.onclick = () => this.insertMarkdownFormat('- [ ] ', '', 'Todo item');
    if (codeBtn) codeBtn.onclick = () => this.insertMarkdownFormat('```\n', '\n```', 'Code block');
    if (quoteBtn) quoteBtn.onclick = () => this.insertMarkdownFormat('> ', '', 'Quote');
    if (highlightBtn) highlightBtn.onclick = () => this.addHighlight();
    if (previewBtn) previewBtn.onclick = () => this.togglePreviewPanel();
  },

  // Insert markdown formatting around selected text or at cursor
  insertMarkdownFormat(before, after, placeholder) {
    const editor = el('#note-body');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const beforeText = editor.value.substring(0, start);
    const afterText = editor.value.substring(end);
    const formattedText = before + textToInsert + after;
    
    editor.value = beforeText + formattedText + afterText;
    
    // Position cursor appropriately
    if (selectedText) {
      // If text was selected, position after the formatting
      const newCursorPos = start + formattedText.length;
      editor.setSelectionRange(newCursorPos, newCursorPos);
    } else {
      // If placeholder was used, select the placeholder text
      const selectionStart = start + before.length;
      const selectionEnd = selectionStart + textToInsert.length;
      editor.setSelectionRange(selectionStart, selectionEnd);
    }
    
    editor.focus();
    
    // Trigger input event for live preview
    editor.dispatchEvent(new Event('input'));
  },

  // Toggle the preview panel visibility
  togglePreviewPanel() {
    const previewPanel = el('#preview-panel');
    const previewBtn = el('#btn-toggle-preview');
    
    if (previewPanel && previewBtn) {
      const isHidden = previewPanel.style.display === 'none';
      previewPanel.style.display = isHidden ? 'block' : 'none';
      
      // Update button icon
      const icon = previewBtn.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'fas fa-eye' : 'fas fa-eye-slash';
      }
      
      previewBtn.title = isHidden ? 'Hide Preview' : 'Show Preview';
    }
  },

  async setNoteColor(color) {
    if (!this.state.currentId) return;
    
    const note = await Store.get(this.state.currentId);
    if (!note) return;

    note.color = color;
    note.updatedAt = nowISO();
    await Store.upsert(note);

    // Update the color button
    const colorButton = el('#noteColorButton');
    if(colorButton) colorButton.style.backgroundColor = color;

    // Mark as dirty and refresh
    const dirty = el('#dirty');
    if(dirty) dirty.classList.remove('hidden');
    await this.refreshHomePage();
    if (this.bc) this.bc.postMessage({ type: 'sync' });
    toast('Note color updated');
  },
  
  bindTagsPageEvents() {
      const button = el('#newTagInput')?.nextElementSibling;
      if(button) button.onclick = () => this.createNewTagFromManager();
  },
  
  bindSettingsPageEvents() {
      const autoLink = el('#autoLink');
      const analytics = el('#enableAnalytics');
      const bc = el('#enableBC');
      
      if(autoLink) autoLink.onchange = (e) => this.state.autoLink = e.target.checked;
      if(analytics) analytics.onchange = (e) => { 
        this.state.analytics = e.target.checked; 
        if(typeof Analytics !== 'undefined') Analytics.enabled = e.target.checked; 
      };
      if(bc) bc.onchange = (e) => { 
        this.state.bc = e.target.checked; 
        if(this.bc) this.bc.close(); 
        this.bc = this.state.bc ? new BroadcastChannel('mahart-notes') : null; 
      };
  },

  // --- ADDITIONAL EVENT BINDING METHODS ---

  bindAdvancedSearchEvents() {
    const searchInput = el('#advanced-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        this.performAdvancedSearch(searchInput.value);
      }, 300));
    }

    // Bind search filter buttons (All, Title Only, Content, Tags)
    const filterButtons = els('#page-search .flex.gap-2.mt-3 button');
    filterButtons.forEach((btn, index) => {
      btn.onclick = () => {
        // Remove active state from all buttons
        filterButtons.forEach(b => {
          b.className = 'px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600';
        });
        // Add active state to clicked button
        btn.className = 'px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700';
        
        const filterType = btn.textContent.trim();
        console.log(`Search filter set to: ${filterType}`);
        this.setSearchFilter(filterType);
        
        // Re-run search with new filter if there's a query
        const query = searchInput?.value.trim();
        if (query) {
          this.performAdvancedSearch(query, filterType);
        }
      };
    });

    // Bind date range selector
    const dateSelect = el('#page-search select');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        console.log(`Date filter set to: ${e.target.value}`);
        this.setDateFilter(e.target.value);
        
        // Re-run search if there's a query
        const query = searchInput?.value.trim();
        if (query) {
          this.performAdvancedSearch(query);
        }
      });
    }

    // Bind color filter buttons
    const colorButtons = els('#page-search .flex.gap-1.flex-wrap button');
    colorButtons.forEach(btn => {
      btn.onclick = () => {
        // Toggle active state
        const isActive = btn.classList.contains('border-white');
        
        if (isActive) {
          btn.classList.remove('border-white');
          btn.classList.add('border-gray-500');
        } else {
          btn.classList.add('border-white');
          btn.classList.remove('border-gray-500');
        }
        
        const color = btn.style.backgroundColor;
        console.log(`Color filter toggled: ${color}`);
        this.toggleColorFilter(color);
        
        // Re-run search if there's a query
        const query = searchInput?.value.trim();
        if (query) {
          this.performAdvancedSearch(query);
        }
      };
    });
  },

  bindAnalyticsPageEvents() {
    // Analytics dashboard is mostly display-only, events handled by Analytics module
    console.log('Analytics page events bound');
  },

  bindTimelinePageEvents() {
    const filterButtons = els('#page-timeline .flex button');
    filterButtons.forEach(btn => {
      btn.onclick = () => {
        filterButtons.forEach(b => b.className = 'px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600');
        btn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
        this.filterTimeline(btn.textContent);
      };
    });
  },

  bindTemplatesPageEvents() {
    // Bind "Use Template" buttons
    const templateButtons = els('#page-templates button');
    templateButtons.forEach(btn => {
      if (btn.textContent.includes('Use Template')) {
        btn.onclick = () => {
          const templateCard = btn.closest('.bg-gray-800');
          const templateName = templateCard.querySelector('h3').textContent.trim();
          console.log(`Applying template: ${templateName}`);
          this.applyTemplate(templateName);
        };
      }
    });

    // Make entire template cards clickable
    const templateCards = els('#page-templates .bg-gray-800');
    templateCards.forEach(card => {
      const button = card.querySelector('button');
      if (button) {
        card.onclick = (e) => {
          // Only trigger if not clicking the button directly
          if (e.target !== button && !button.contains(e.target)) {
            button.click();
          }
        };
        
        // Add visual feedback
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = 'none';
        });
      }
    });

    console.log(`Bound events for ${templateButtons.length} template buttons and ${templateCards.length} template cards`);
  },

  bindPresentationsPageEvents() {
    // Bind generate presentation button
    const generateBtn = el('#page-presentations button');
    if (generateBtn && generateBtn.textContent.includes('Generate')) {
      generateBtn.onclick = () => {
        const titleInput = el('#page-presentations input[type="text"]');
        const title = titleInput?.value.trim();
        
        if (!title) {
          toast('Please enter a presentation title');
          titleInput?.focus();
          return;
        }
        
        console.log(`Generating presentation: ${title}`);
        this.generatePresentation(title);
      };
    }

    // Load notes list for selection
    this.loadPresentationNotesList();

    console.log('Presentation page events bound');
  },

  bindExportPageEvents() {
    // Bind all export buttons
    const exportButtons = els('#page-export button');
    exportButtons.forEach(btn => {
      const buttonText = btn.textContent.trim();
      
      if (buttonText.includes('Export Markdown')) {
        btn.onclick = () => {
          console.log('Exporting to Markdown...');
          btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Exporting...';
          btn.disabled = true;
          
          setTimeout(() => {
            this.exportMarkdown();
            btn.innerHTML = 'Export Markdown';
            btn.disabled = false;
          }, 1000);
        };
      } else if (buttonText.includes('Export JSON')) {
        btn.onclick = () => {
          console.log('Exporting to JSON...');
          btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Exporting...';
          btn.disabled = true;
          
          setTimeout(() => {
            this.exportJSON();
            btn.innerHTML = 'Export JSON';
            btn.disabled = false;
          }, 1000);
        };
      } else if (buttonText.includes('Export PDF')) {
        btn.onclick = () => {
          console.log('Exporting to PDF...');
          btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Exporting...';
          btn.disabled = true;
          
          setTimeout(() => {
            this.exportPDF();
            btn.innerHTML = 'Export PDF';
            btn.disabled = false;
          }, 1500);
        };
      } else if (buttonText.includes('Download')) {
        btn.onclick = () => {
          console.log('Downloading previous export...');
          this.downloadPreviousExport();
        };
      }
    });

    // Load export history
    this.loadExportHistory();

    console.log(`Bound events for ${exportButtons.length} export buttons`);
  },

  bindBackupPageEvents() {
    const createBackupBtn = el('#page-backup button');
    if (createBackupBtn && createBackupBtn.textContent.includes('Create Backup')) {
      createBackupBtn.onclick = () => this.createBackup();
    }

    const connectButtons = els('#page-backup button');
    connectButtons.forEach(btn => {
      if (btn.textContent === 'Connect' && btn.closest('.border').querySelector('h4').textContent === 'Google Drive') {
        btn.onclick = () => this.connectGoogleDrive();
      } else if (btn.textContent === 'Connect' && btn.closest('.border').querySelector('h4').textContent === 'Dropbox') {
        btn.onclick = () => this.connectDropbox();
      }
    });
  },

  bindRecommendationsPageEvents() {
    // Load initial recommendations
    this.loadRecommendations();

    // Bind Apply and Dismiss buttons
    const applyButtons = els('#page-recommendations button');
    applyButtons.forEach(btn => {
      const buttonText = btn.textContent.trim();
      
      if (buttonText === 'Apply') {
        btn.onclick = () => {
          const recommendation = btn.closest('.bg-gray-700');
          const recommendationType = recommendation.querySelector('h4').textContent;
          console.log(`Applying recommendation: ${recommendationType}`);
          this.applyRecommendation(recommendation, recommendationType);
        };
      } else if (buttonText === 'Dismiss') {
        btn.onclick = () => {
          const recommendation = btn.closest('.bg-gray-700');
          const recommendationType = recommendation.querySelector('h4').textContent;
          console.log(`Dismissing recommendation: ${recommendationType}`);
          this.dismissRecommendation(recommendation);
        };
      }
    });

    // Bind recommendation settings checkboxes
    const settingsCheckboxes = els('#page-recommendations input[type="checkbox"]');
    settingsCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const settingName = e.target.previousElementSibling.textContent;
        console.log(`Recommendation setting "${settingName}" ${e.target.checked ? 'enabled' : 'disabled'}`);
        this.updateRecommendationSettings(settingName, e.target.checked);
      });
    });

    console.log(`Recommendations page events bound - ${applyButtons.length} buttons, ${settingsCheckboxes.length} settings`);
  },

  bindLearningPageEvents() {
    // Initialize quiz data
    this.initializeLearningQuiz();

    // Bind answer buttons
    const answerButtons = els('#page-learning .bg-gray-600');
    answerButtons.forEach((btn, index) => {
      btn.onclick = () => {
        console.log(`Answer ${index + 1} selected`);
        this.selectAnswer(btn, index);
      };
    });

    // Bind navigation buttons
    const previousBtn = el('#page-learning button[class*="bg-gray-600"]');
    const nextBtn = el('#page-learning button[class*="bg-blue-600"]');
    
    if (previousBtn) {
      previousBtn.onclick = () => {
        console.log('Previous question');
        this.previousQuestion();
      };
    }
    
    if (nextBtn) {
      nextBtn.onclick = () => {
        console.log('Next question');
        this.nextQuestion();
      };
    }

    console.log(`Learning page events bound - ${answerButtons.length} answer buttons`);
  },

  bindWorkspacePageEvents() {
    // Bind Switch workspace buttons
    const switchButtons = els('#page-workspace button');
    switchButtons.forEach(btn => {
      const buttonText = btn.textContent.trim();
      
      if (buttonText === 'Switch') {
        btn.onclick = () => {
          const workspace = btn.closest('.bg-gray-700').querySelector('h4').textContent;
          console.log(`Switching to workspace: ${workspace}`);
          this.switchWorkspace(workspace);
        };
      } else if (buttonText === 'Create Workspace') {
        btn.onclick = () => {
          console.log('Creating new workspace');
          this.createWorkspace();
        };
      }
    });

    // Load workspace data
    this.loadWorkspaceData();

    console.log(`Workspace page events bound - ${switchButtons.length} buttons`);
  },

  bindThemesPageEvents() {
    // Bind clickable theme options
    const themeOptions = els('#page-themes .cursor-pointer');
    themeOptions.forEach(option => {
      option.onclick = () => {
        const themeName = option.querySelector('h4').textContent.trim();
        console.log(`Applying theme: ${themeName}`);
        this.applyTheme(themeName);
        this.updateThemeSelection(option);
      };
    });

    // Bind custom theme button
    const customThemeBtn = el('#page-themes button');
    if (customThemeBtn && customThemeBtn.textContent.includes('Apply Custom Theme')) {
      customThemeBtn.onclick = () => {
        console.log('Applying custom theme');
        this.applyCustomTheme();
      };
    }

    // Bind color input changes for live preview
    const colorInputs = els('#page-themes input[type="color"]');
    const textInputs = els('#page-themes input[type="text"]');
    
    colorInputs.forEach((colorInput, index) => {
      const textInput = textInputs[index];
      
      colorInput.addEventListener('input', (e) => {
        if (textInput) {
          textInput.value = e.target.value;
        }
        this.previewCustomTheme();
      });
      
      if (textInput) {
        textInput.addEventListener('input', (e) => {
          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            colorInput.value = e.target.value;
            this.previewCustomTheme();
          }
        });
      }
    });

    console.log(`Themes page events bound - ${themeOptions.length} theme options, ${colorInputs.length} color inputs`);
  },

  bindPluginsPageEvents() {
    // Bind all plugin management buttons
    const pluginButtons = els('#page-plugins button');
    pluginButtons.forEach(btn => {
      const buttonText = btn.textContent.trim();
      
      if (buttonText === 'Install Plugin') {
        // Main install plugin button
        btn.onclick = () => {
          console.log('Opening plugin installation dialog');
          this.openPluginInstallDialog();
        };
      } else if (buttonText === 'Configure') {
        btn.onclick = () => {
          const pluginContainer = btn.closest('.flex.items-center.justify-between');
          const plugin = pluginContainer.querySelector('h4').textContent.trim();
          console.log(`Configuring plugin: ${plugin}`);
          this.configurePlugin(plugin);
        };
      } else if (buttonText === 'Activate') {
        btn.onclick = () => {
          const pluginContainer = btn.closest('.flex.items-center.justify-between');
          const plugin = pluginContainer.querySelector('h4').textContent.trim();
          console.log(`Activating plugin: ${plugin}`);
          this.activatePlugin(plugin);
        };
      } else if (buttonText === 'Install') {
        // Individual plugin install buttons in the store
        btn.onclick = () => {
          const pluginCard = btn.closest('.border.border-gray-600');
          const plugin = pluginCard.querySelector('h4').textContent.trim();
          console.log(`Installing plugin: ${plugin}`);
          this.installPlugin(plugin);
        };
      }
    });

    // Load plugin data
    this.loadPluginData();

    console.log(`Plugins page events bound - ${pluginButtons.length} buttons`);
  },

  // --- PAGE ACTION METHODS ---

  performAdvancedSearch(query, filterType = 'All') {
    const resultsContainer = el('#search-results');
    if (!resultsContainer || !query.trim()) {
      if (resultsContainer) resultsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Enter a search term to see results</p>';
      return;
    }
    
    if (typeof AdvancedSearch !== 'undefined') {
      AdvancedSearch.performSearch(query, filterType);
    } else {
      // Enhanced fallback search with filters
      this.performBasicSearch(query, resultsContainer, filterType);
    }
  },

  async performBasicSearch(query, container, filterType = 'All') {
    let notes = await Store.allNotes();
    
    // Apply date filter if set
    if (this.searchFilters?.dateRange && this.searchFilters.dateRange !== 'All Time') {
      notes = this.filterNotesByDate(notes, this.searchFilters.dateRange);
    }
    
    // Apply color filter if set
    if (this.searchFilters?.colors && this.searchFilters.colors.length > 0) {
      notes = notes.filter(note => this.searchFilters.colors.includes(note.color || '#6B7280'));
    }

    // Apply search query with filter type
    const queryLower = query.toLowerCase();
    const results = notes.filter(note => {
      switch (filterType) {
        case 'Title Only':
          return note.title.toLowerCase().includes(queryLower);
        case 'Content':
          return note.body.toLowerCase().includes(queryLower);
        case 'Tags':
          return note.tags.some(tag => tag.toLowerCase().includes(queryLower));
        default: // 'All'
          return note.title.toLowerCase().includes(queryLower) ||
                 note.body.toLowerCase().includes(queryLower) ||
                 note.tags.some(tag => tag.toLowerCase().includes(queryLower));
      }
    });

    if (results.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-400">No results found</p>
          <p class="text-gray-500 text-sm mt-2">Try adjusting your search filters or query</p>
        </div>
      `;
      return;
    }

    const html = results.map(note => `
      <div class="p-4 hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-600 mb-3 transition-all duration-200" onclick="UI.openNoteFromSearch('${note.id}')">
        <div class="flex items-start justify-between">
          <div class="flex-grow">
            <h4 class="font-medium text-white mb-1">${note.title}</h4>
            <p class="text-gray-300 text-sm leading-relaxed">${note.body.substring(0, 200)}${note.body.length > 200 ? '...' : ''}</p>
            ${note.tags.length > 0 ? `
              <div class="flex gap-1 mt-3 flex-wrap">
                ${note.tags.map(tag => `<span class="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition-colors">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="ml-4 flex-shrink-0">
            <div class="w-4 h-4 rounded-full border border-gray-500" style="background-color: ${note.color || '#6B7280'}" title="Note color"></div>
            <div class="text-xs text-gray-500 mt-1">${new Date(note.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="mb-4">
        <p class="text-gray-400 text-sm">Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"</p>
      </div>
      ${html}
    `;
  },

  openNoteFromSearch(noteId) {
    window.location.hash = '#/';
    setTimeout(() => this.openNote(noteId), 100);
  },

  setSearchFilter(filter) {
    if (!this.searchFilters) {
      this.searchFilters = { 
        type: 'All', 
        dateRange: 'All Time',
        colors: []
      };
    }
    this.searchFilters.type = filter;
    console.log(`Search filter set to: ${filter}`);
  },

  setDateFilter(dateRange) {
    if (!this.searchFilters) {
      this.searchFilters = { 
        type: 'All', 
        dateRange: 'All Time',
        colors: []
      };
    }
    this.searchFilters.dateRange = dateRange;
    console.log(`Date filter set to: ${dateRange}`);
  },

  toggleColorFilter(color) {
    if (!this.searchFilters) {
      this.searchFilters = { 
        type: 'All', 
        dateRange: 'All Time',
        colors: []
      };
    }
    
    const colorIndex = this.searchFilters.colors.indexOf(color);
    if (colorIndex === -1) {
      this.searchFilters.colors.push(color);
    } else {
      this.searchFilters.colors.splice(colorIndex, 1);
    }
    console.log(`Color filters: ${this.searchFilters.colors.join(', ')}`);
  },

  filterNotesByDate(notes, dateRange) {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (dateRange) {
      case 'Last 7 Days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'Last 30 Days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'Last 90 Days':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return notes;
    }
    
    return notes.filter(note => {
      const noteDate = new Date(note.updatedAt || note.createdAt);
      return noteDate >= cutoffDate;
    });
  },

  loadAnalyticsDashboard() {
    if (typeof Analytics !== 'undefined') {
      Analytics.loadDashboard();
    } else {
      this.loadBasicAnalytics();
    }
  },

  async loadBasicAnalytics() {
    const notes = await Store.allNotes();
    const totalNotes = el('#total-notes-count');
    const totalLinks = el('#total-links-count');
    const totalTags = el('#total-tags-count');

    if (totalNotes) totalNotes.textContent = notes.length;
    if (totalLinks) totalLinks.textContent = notes.reduce((acc, note) => acc + note.links.length, 0);
    if (totalTags) {
      const allTags = new Set();
      notes.forEach(note => note.tags.forEach(tag => allTags.add(tag)));
      totalTags.textContent = allTags.size;
    }
  },

  loadKnowledgeInsights() {
    console.log('Loading knowledge insights...');
    // Placeholder for insights functionality
  },

  loadKnowledgeTimeline() {
    this.filterTimeline('All');
  },

  async filterTimeline(filter) {
    const timelineContent = el('#timeline-content');
    if (!timelineContent) return;

    const notes = await Store.allNotes();
    let filteredNotes = notes;

    if (filter !== 'All') {
      // Filter logic based on the filter type
      filteredNotes = notes; // Placeholder
    }

    const html = filteredNotes.slice(0, 10).map(note => `
      <div class="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
        <div class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
        <div class="flex-grow">
          <h4 class="font-medium text-white">${note.title}</h4>
          <p class="text-gray-400 text-sm">${new Date(note.updatedAt).toLocaleDateString()}</p>
          <p class="text-gray-300 text-sm mt-1">${note.body.substring(0, 100)}...</p>
        </div>
      </div>
    `).join('');

    timelineContent.innerHTML = html || '<p class="text-gray-400 text-center py-8">No timeline data available</p>';
  },

  applyTemplate(templateName) {
    console.log(`Applying template: ${templateName}`);
    if (typeof SmartTemplates !== 'undefined') {
      SmartTemplates.applyTemplate(templateName);
    } else {
      // Navigate to editor and create a basic template
      window.location.hash = '#/';
      setTimeout(() => {
        const editor = el('#note-body');
        const title = el('#note-title');
        if (title) title.value = `${templateName} - ${new Date().toLocaleDateString()}`;
        if (editor) {
          editor.value = this.getBasicTemplate(templateName);
          this.renderPreviewLive();
        }
      }, 100);
    }
  },

  getBasicTemplate(templateName) {
    const templates = {
      'Meeting Notes': `# Meeting Notes - ${new Date().toLocaleDateString()}

## Attendees
- 

## Agenda
1. 

## Discussion
- 

## Action Items
- [ ] 

## Next Meeting
- Date: 
- Time: `,
      'Project Planning': `# Project: [Project Name]

## Overview
Brief description of the project

## Goals
1. 

## Timeline
- Start Date: 
- End Date: 
- Milestones:
  - [ ] Milestone 1
  - [ ] Milestone 2

## Resources
- People: 
- Budget: 
- Tools: 

## Risks
- 

## Next Steps
1. `,
      'Research Notes': `# Research: [Topic]

## Hypothesis
What you're trying to prove or explore

## Sources
1. 

## Key Findings
- 

## Notes
- 

## Conclusion
Summary of findings

## References
- `
    };
    return templates[templateName] || `# ${templateName}\n\nTemplate content here...`;
  },

  async loadPresentationNotesList() {
    const notesList = el('#presentation-notes-list');
    if (!notesList) return;

    const notes = await Store.allNotes();
    if (notes.length === 0) {
      notesList.innerHTML = '<p class="text-gray-400">No notes available</p>';
      return;
    }

    const html = notes.map(note => `
      <label class="flex items-center py-2 px-2 hover:bg-gray-600 rounded cursor-pointer">
        <input type="checkbox" class="mr-3 rounded" value="${note.id}">
        <div class="flex-grow">
          <div class="font-medium text-white text-sm">${note.title}</div>
          <div class="text-gray-400 text-xs">${note.tags.join(', ')}</div>
        </div>
      </label>
    `).join('');

    notesList.innerHTML = html;
  },

  generatePresentation(title) {
    console.log(`Generating presentation: ${title}`);
    
    // Get selected notes
    const checkboxes = els('#presentation-notes-list input[type="checkbox"]:checked');
    const selectedNoteIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedNoteIds.length === 0) {
      toast('Please select at least one note');
      return;
    }

    if (typeof PresentationGenerator !== 'undefined') {
      PresentationGenerator.generate(title, selectedNoteIds);
    } else {
      // Create a simple presentation preview
      this.createSimplePresentation(title, selectedNoteIds);
    }
  },

  async createSimplePresentation(title, noteIds) {
    const notes = await Store.allNotes();
    const selectedNotes = notes.filter(note => noteIds.includes(note.id));
    
    // Create a new note with presentation content
    const presentationContent = `# ${title}

*Generated on ${new Date().toLocaleDateString()}*

---

${selectedNotes.map((note, index) => `
## Slide ${index + 1}: ${note.title}

${note.body}

---
`).join('\n')}

## Thank You

*Presentation created from ${selectedNotes.length} notes*
`;

    const presentationNote = {
      id: ULID(),
      title: `Presentation: ${title}`,
      body: presentationContent,
      tags: ['#presentation', '#generated'],
      color: '#8B5CF6',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      links: []
    };

    await Store.upsert(presentationNote);
    toast(`Presentation "${title}" created as a new note`);
    
    // Navigate to the new presentation note
    window.location.hash = '#/';
    setTimeout(() => this.openNote(presentationNote.id), 200);
  },

  exportMarkdown() {
    if (typeof DataManagement !== 'undefined') {
      DataManagement.exportMarkdown();
    } else {
      this.basicExportMarkdown();
    }
  },

  exportJSON() {
    if (typeof DataManagement !== 'undefined') {
      DataManagement.exportJSON();
    } else {
      this.basicExportJSON();
    }
  },

  exportPDF() {
    if (typeof DataManagement !== 'undefined') {
      DataManagement.exportPDF();
    } else {
      alert('PDF export not available yet');
    }
  },

  async basicExportMarkdown() {
    const notes = await Store.allNotes();
    const zip = notes.map(note => `# ${note.title}\n\n${note.body}\n\nTags: ${note.tags.join(', ')}\n\n---\n\n`).join('');
    this.downloadFile('notes-export.md', zip);
  },

  async basicExportJSON() {
    const notes = await Store.allNotes();
    const data = JSON.stringify(notes, null, 2);
    this.downloadFile('notes-backup.json', data);
  },

  loadExportHistory() {
    // This would normally load from localStorage or a database
    // For now, just update the display with current data
    this.updateExportHistoryDisplay();
  },

  async updateExportHistoryDisplay() {
    const notes = await Store.allNotes();
    const historyContainer = el('#page-export .bg-gray-700');
    
    if (historyContainer) {
      const noteCount = notes.length;
      const estimatedSize = Math.round((JSON.stringify(notes).length / 1024) * 100) / 100;
      
      historyContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-white">Current Data</h4>
            <p class="text-gray-400 text-sm">JSON • ${estimatedSize} KB • ${noteCount} notes • Ready to export</p>
          </div>
          <button class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onclick="UI.exportJSON()">Export Now</button>
        </div>
      `;
    }
  },

  downloadPreviousExport() {
    // For demo, just export current data
    this.exportJSON();
    toast('Downloading current data');
  },

  downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Store export history
    this.addToExportHistory(filename, type, content.length);
  },

  addToExportHistory(filename, type, size) {
    const history = JSON.parse(localStorage.getItem('exportHistory') || '[]');
    history.unshift({
      filename,
      type,
      size,
      timestamp: Date.now()
    });
    
    // Keep only last 10 exports
    if (history.length > 10) {
      history.splice(10);
    }
    
    localStorage.setItem('exportHistory', JSON.stringify(history));
  },

  createBackup() {
    this.basicExportJSON();
    toast('Backup created and downloaded');
  },

  connectGoogleDrive() {
    alert('Google Drive integration coming soon');
  },

  connectDropbox() {
    alert('Dropbox integration coming soon');
  },

  applyRecommendation(element) {
    element.style.opacity = '0.5';
    toast('Recommendation applied');
  },

  dismissRecommendation(element) {
    element.remove();
  },

  initializeLearningQuiz() {
    if (!this.quizState) {
      this.quizState = {
        currentQuestion: 0,
        totalQuestions: 5,
        selectedAnswers: {},
        score: 0
      };
    }
  },

  selectAnswer(button, answerIndex) {
    // Remove selection from other buttons
    const allAnswers = els('#page-learning .space-y-3 button');
    allAnswers.forEach(btn => {
      btn.className = 'w-full p-3 text-left bg-gray-600 hover:bg-gray-500 rounded transition-colors text-white';
    });
    
    // Highlight selected answer
    button.className = 'w-full p-3 text-left bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white';
    
    // Store the selected answer
    this.quizState.selectedAnswers[this.quizState.currentQuestion] = answerIndex;
    
    // Enable next button
    const nextBtn = el('#page-learning button[class*="bg-blue-600"]:last-of-type');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
    }
    
    toast(`Answer ${answerIndex + 1} selected`);
  },

  previousQuestion() {
    if (this.quizState.currentQuestion > 0) {
      this.quizState.currentQuestion--;
      this.updateQuizDisplay();
    }
  },

  nextQuestion() {
    if (this.quizState.currentQuestion < this.quizState.totalQuestions - 1) {
      this.quizState.currentQuestion++;
      this.updateQuizDisplay();
    } else {
      this.finishQuiz();
    }
  },

  updateQuizDisplay() {
    // Update question counter
    const questionText = el('#page-learning h4');
    if (questionText) {
      questionText.textContent = `Question ${this.quizState.currentQuestion + 1} of ${this.quizState.totalQuestions}`;
    }

    // Update progress dots
    const dots = els('#page-learning .flex.gap-2 .rounded-full');
    dots.forEach((dot, index) => {
      if (index === this.quizState.currentQuestion) {
        dot.className = 'w-3 h-3 bg-blue-600 rounded-full';
      } else if (index < this.quizState.currentQuestion) {
        dot.className = 'w-3 h-3 bg-green-600 rounded-full';
      } else {
        dot.className = 'w-3 h-3 bg-gray-600 rounded-full';
      }
    });

    // Update button states
    const prevBtn = el('#page-learning button[class*="bg-gray-600"]');
    const nextBtn = el('#page-learning button[class*="bg-blue-600"]:last-of-type');
    
    if (prevBtn) {
      prevBtn.disabled = this.quizState.currentQuestion === 0;
      prevBtn.style.opacity = this.quizState.currentQuestion === 0 ? '0.5' : '1';
    }
    
    if (nextBtn) {
      const hasAnswer = this.quizState.selectedAnswers.hasOwnProperty(this.quizState.currentQuestion);
      nextBtn.disabled = !hasAnswer;
      nextBtn.style.opacity = hasAnswer ? '1' : '0.5';
      
      if (this.quizState.currentQuestion === this.quizState.totalQuestions - 1) {
        nextBtn.textContent = 'Finish Quiz';
      } else {
        nextBtn.textContent = 'Next';
      }
    }

    // Clear answer selections
    const answerButtons = els('#page-learning .space-y-3 button');
    answerButtons.forEach(btn => {
      btn.className = 'w-full p-3 text-left bg-gray-600 hover:bg-gray-500 rounded transition-colors text-white';
    });
  },

  finishQuiz() {
    const totalAnswered = Object.keys(this.quizState.selectedAnswers).length;
    toast(`Quiz completed! You answered ${totalAnswered} out of ${this.quizState.totalQuestions} questions.`);
    
    // Reset quiz
    this.quizState = null;
    this.updateQuizDisplay();
  },

  loadRecommendations() {
    // This would normally load from an AI service
    this.generateMockRecommendations();
  },

  async generateMockRecommendations() {
    const notes = await Store.allNotes();
    const recommendationsList = el('#recommendations-list');
    
    if (!recommendationsList || notes.length < 2) return;

    const recommendations = [
      {
        title: 'Create Missing Link',
        description: `Consider linking "${notes[0]?.title}" and "${notes[1]?.title}" - they share common themes.`,
        type: 'link'
      },
      {
        title: 'Tag Suggestion',
        description: `Your recent notes about projects could benefit from the #planning tag.`,
        type: 'tag'
      },
      {
        title: 'Content Enhancement',
        description: `Add more details to your notes about methodology for better searchability.`,
        type: 'content'
      }
    ];

    const html = recommendations.map(rec => `
      <div class="bg-gray-700 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-medium text-white mb-2">${rec.title}</h4>
            <p class="text-gray-300 text-sm">${rec.description}</p>
          </div>
          <div class="flex gap-2">
            <button class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Apply</button>
            <button class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">Dismiss</button>
          </div>
        </div>
      </div>
    `).join('');

    recommendationsList.innerHTML = html;
    
    // Re-bind events for the new buttons
    this.bindRecommendationsPageEvents();
  },

  applyRecommendation(element, type) {
    console.log(`Applying recommendation: ${type}`);
    
    // Visual feedback
    element.style.transform = 'scale(0.95)';
    element.style.opacity = '0.7';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '0.5';
      
      // Update button text
      const applyBtn = element.querySelector('button[class*="bg-green"]');
      if (applyBtn) {
        applyBtn.textContent = 'Applied';
        applyBtn.className = 'px-3 py-1 bg-gray-500 text-white text-sm rounded cursor-not-allowed';
        applyBtn.disabled = true;
      }
      
      toast(`Recommendation "${type}" applied successfully`);
    }, 200);
  },

  dismissRecommendation(element) {
    // Fade out animation
    element.style.transition = 'all 0.3s ease';
    element.style.transform = 'translateX(100px)';
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.remove();
      toast('Recommendation dismissed');
    }, 300);
  },

  updateRecommendationSettings(settingName, enabled) {
    const settings = JSON.parse(localStorage.getItem('recommendationSettings') || '{}');
    settings[settingName] = enabled;
    localStorage.setItem('recommendationSettings', JSON.stringify(settings));
    
    toast(`${settingName} ${enabled ? 'enabled' : 'disabled'}`);
  },

  loadWorkspaceData() {
    // Load workspace statistics
    this.updateWorkspaceStats();
  },

  async updateWorkspaceStats() {
    const notes = await Store.allNotes();
    const workspaceCards = els('#page-workspace .bg-gray-700');
    
    workspaceCards.forEach(card => {
      const statsElement = card.querySelector('.text-gray-400');
      if (statsElement && statsElement.textContent.includes('•')) {
        // Update note count for active workspace
        statsElement.textContent = `Personal knowledge base • ${notes.length} notes`;
      }
    });
  },

  switchWorkspace(workspaceName) {
    console.log(`Switching to workspace: ${workspaceName}`);
    
    // Update workspace selection UI
    const workspaceCards = els('#page-workspace .bg-gray-700');
    workspaceCards.forEach(card => {
      const cardTitle = card.querySelector('h4').textContent.trim();
      const statusSpan = card.querySelector('span');
      const button = card.querySelector('button');
      
      if (cardTitle === workspaceName) {
        // Set as active
        card.className = 'bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500';
        if (statusSpan) {
          statusSpan.textContent = 'Active';
          statusSpan.className = 'px-2 py-1 bg-blue-600 text-white text-xs rounded';
        }
        if (button) button.style.display = 'none';
      } else {
        // Set as inactive
        card.className = 'bg-gray-700 rounded-lg p-4';
        if (statusSpan) {
          statusSpan.style.display = 'none';
        }
        if (button) {
          button.style.display = 'block';
          button.textContent = 'Switch';
        }
      }
    });
    
    toast(`Switched to ${workspaceName}`);
  },

  createWorkspace() {
    const nameInput = el('#page-workspace input[type="text"]');
    const descInput = el('#page-workspace textarea');
    
    const name = nameInput?.value.trim();
    const description = descInput?.value.trim();
    
    if (!name) {
      toast('Please enter a workspace name');
      nameInput?.focus();
      return;
    }
    
    console.log(`Creating workspace: ${name}`);
    
    // Create new workspace card
    const workspaceContainer = el('#page-workspace .space-y-3');
    if (workspaceContainer) {
      const newWorkspaceHTML = `
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-white">${name}</h4>
              <p class="text-gray-400 text-sm">${description || 'New workspace'} • 0 notes</p>
            </div>
            <button class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500">Switch</button>
          </div>
        </div>
      `;
      
      workspaceContainer.insertAdjacentHTML('beforeend', newWorkspaceHTML);
      
      // Re-bind events for the new button
      this.bindWorkspacePageEvents();
    }
    
    toast('Workspace created successfully');
    nameInput.value = '';
    if (descInput) descInput.value = '';
  },

  updateThemeSelection(selectedOption) {
    // Remove border from all theme options
    const allOptions = els('#page-themes .border-2, #page-themes .border');
    allOptions.forEach(option => {
      if (option.classList.contains('border-2')) {
        option.className = option.className.replace('border-2 border-blue-500', 'border border-gray-600');
      }
    });
    
    // Add blue border to selected option
    selectedOption.className = selectedOption.className.replace('border border-gray-600', 'border-2 border-blue-500');
  },

  previewCustomTheme() {
    // This would normally apply a live preview
    console.log('Previewing custom theme...');
  },

  applyTheme(themeName) {
    console.log(`Applying theme: ${themeName}`);
    if (typeof ThemeManager !== 'undefined') {
      ThemeManager.applyTheme(themeName);
    } else {
      toast(`${themeName} theme applied`);
    }
  },

  applyCustomTheme() {
    console.log('Applying custom theme');
    toast('Custom theme applied');
  },

  loadPluginData() {
    // Update plugin status and information
    this.updatePluginStats();
  },

  updatePluginStats() {
    // This would normally load from plugin registry
    console.log('Plugin data loaded');
  },

  openPluginInstallDialog() {
    // Create a simple modal for plugin installation
    const modalHTML = `
      <div id="plugin-install-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-semibold text-white mb-4">Install Plugin</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-300 mb-2">Plugin URL or Name</label>
              <input type="text" placeholder="Enter plugin name or URL" class="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white">
            </div>
            <div class="flex gap-3">
              <button onclick="UI.installPluginFromDialog()" class="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Install</button>
              <button onclick="UI.closePluginDialog()" class="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  installPluginFromDialog() {
    const modal = el('#plugin-install-modal');
    const input = modal.querySelector('input');
    const pluginName = input?.value.trim();
    
    if (!pluginName) {
      toast('Please enter a plugin name');
      return;
    }
    
    // Simulate installation
    toast(`Installing ${pluginName}...`);
    setTimeout(() => {
      toast(`${pluginName} installed successfully`);
      this.addInstalledPlugin(pluginName);
      this.closePluginDialog();
    }, 2000);
  },

  addInstalledPlugin(pluginName) {
    const installedContainer = el('#page-plugins .space-y-4');
    if (installedContainer) {
      const pluginHTML = `
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-puzzle-piece text-white"></i>
            </div>
            <div>
              <h4 class="font-medium text-white">${pluginName}</h4>
              <p class="text-gray-400 text-sm">Custom installed plugin</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 bg-gray-600 text-white text-xs rounded">Inactive</span>
            <button class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Activate</button>
          </div>
        </div>
      `;
      installedContainer.insertAdjacentHTML('beforeend', pluginHTML);
      
      // Re-bind events
      this.bindPluginsPageEvents();
    }
  },

  closePluginDialog() {
    const modal = el('#plugin-install-modal');
    if (modal) {
      modal.remove();
    }
  },

  configurePlugin(pluginName) {
    console.log(`Configuring plugin: ${pluginName}`);
    
    // Create simple configuration dialog
    const configHTML = `
      <div id="plugin-config-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-semibold text-white mb-4">Configure ${pluginName}</h3>
          <div class="space-y-4">
            <div>
              <label class="flex items-center justify-between py-2">
                <span class="text-gray-300">Enable notifications</span>
                <input type="checkbox" checked>
              </label>
              <label class="flex items-center justify-between py-2">
                <span class="text-gray-300">Auto-sync</span>
                <input type="checkbox">
              </label>
            </div>
            <div class="flex gap-3">
              <button onclick="UI.savePluginConfig('${pluginName}')" class="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              <button onclick="UI.closePluginDialog()" class="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', configHTML);
  },

  savePluginConfig(pluginName) {
    toast(`${pluginName} configuration saved`);
    const modal = el('#plugin-config-modal');
    if (modal) modal.remove();
  },

  activatePlugin(pluginName) {
    console.log(`Activating plugin: ${pluginName}`);
    const button = event.target;
    const statusSpan = button.parentElement.querySelector('span');
    
    // Visual feedback
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Activating...';
    button.disabled = true;
    
    setTimeout(() => {
      // Update button and status
      button.textContent = 'Configure';
      button.className = 'px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500';
      button.disabled = false;
      
      if (statusSpan) {
        statusSpan.textContent = 'Active';
        statusSpan.className = 'px-2 py-1 bg-green-600 text-white text-xs rounded';
      }
      
      toast(`${pluginName} activated successfully`);
    }, 1500);
  },

  installPlugin(pluginName) {
    console.log(`Installing plugin: ${pluginName}`);
    const button = event.target;
    
    // Visual feedback
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Installing...';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = 'Installed';
      button.className = 'w-full py-1 bg-green-600 text-white text-xs rounded cursor-not-allowed';
      toast(`${pluginName} installed successfully`);
    }, 2000);
  },

  updateNavigation(currentPath) {
    // Remove active class from all navigation items
    const navItems = els('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active', 'bg-blue-600');
      item.classList.add('hover:bg-blue-600');
    });

    // Add active class to current page
    const currentNavItem = el(`a[href="${currentPath}"]`);
    if (currentNavItem) {
      currentNavItem.classList.add('active', 'bg-blue-600');
      currentNavItem.classList.remove('hover:bg-blue-600');
    }
  },

  updateSidebarStatus(noteCount) {
    const noteCounter = el('#note-counter');
    const noteCountEl = el('#noteCount');
    
    if (noteCounter) {
      noteCounter.textContent = `${noteCount} note${noteCount !== 1 ? 's' : ''}`;
    }
    
    if (noteCountEl) {
      noteCountEl.textContent = noteCount;
    }
  },

  // --- CORE LOGIC ---

  async refreshCurrentPage() {
      const path = window.location.hash || '#/';
      console.log(`Refreshing page: ${path}`);
      
      // Update navigation active state
      this.updateNavigation(path);
      
      if (path === '#/' || path === '') await this.refreshHomePage();
      if (path === '#/tags') await this.renderTagManager();
      if (path === '#/graph') await this.renderGraph();
      if (path === '#/analytics') this.loadAnalyticsDashboard();
  },

  async refreshHomePage() {
    const notes = await Store.allNotes();
    this.updateSidebarStatus(notes.length);
    this.renderNoteList(notes);
  },

  async openNote(id, alreadyOnPage = false) {
    const n = await Store.get(id);
    if (!n) {
        console.error(`Note with id ${id} not found.`);
        localStorage.removeItem('lastOpenNoteId');
        return;
    }

    this.state.currentId = n.id;
    localStorage.setItem('lastOpenNoteId', n.id);
    
    if (!alreadyOnPage && window.location.hash !== '#/') {
        window.location.hash = '#/';
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const titleEl = el('#title');
    const editorEl = el('#editor');
    const colorButton = el('#noteColorButton');
    
    if(titleEl) titleEl.value = n.title || '';
    if(editorEl) editorEl.value = n.body || '';
    if(colorButton) colorButton.style.backgroundColor = n.color || '#6B7280';
    
    const dirty = el('#dirty');
    if(dirty) dirty.classList.add('hidden');
    this.renderPreviewLive();
    this.renderNoteList(await Store.allNotes()); // Refresh list to show active note
  },

  async newNote() {
    const n = Note.create({ title: 'Untitled', body: '', tags: [] });
    await Store.upsert(n);
    await this.refreshHomePage();
    await this.openNote(n.id);
  },

  async save() {
    const id = this.state.currentId;
    if (!id) return;

    const n = await Store.get(id);
    const titleEl = el('#title');
    const editorEl = el('#editor');
    
    if(!titleEl || !editorEl) return;
    
    n.title = titleEl.value.trim() || '(untitled)';
    n.body = editorEl.value;
    n.tags = [...new Set((n.body.match(/#[a-z0-9_\-]+/gi) || []).map(t => t.toLowerCase()))];
    
    if (this.state.autoLink) {
      const all = await Store.allNotes();
      Note.computeLinks(n, all);
    }
    n.updatedAt = nowISO();
    await Store.upsert(n);
    const dirty = el('#dirty');
    if(dirty) dirty.classList.add('hidden');
    toast('Saved');
    await this.refreshHomePage();
    if (this.bc) this.bc.postMessage({ type: 'sync' });
  },

  // --- RENDERING LOGIC ---

  renderNoteList(notes) {
    const box = el('#noteList');
    if (!box) return;

    const sorted = [...notes].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    box.innerHTML = '';
    for (const n of sorted) {
      const div = document.createElement('div');
      const isActive = n.id === this.state.currentId;
      div.className = `p-2 rounded cursor-pointer ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`;
      div.innerHTML = `
        <div class="font-semibold text-white truncate">${n.title || '(untitled)'}</div>
        <div class="text-xs text-gray-400">${(n.updatedAt || n.createdAt).slice(0, 10)}</div>
      `;
      div.onclick = () => this.openNote(n.id);
      box.appendChild(div);
    }
    const noteCount = el('#noteCount');
    if(noteCount) noteCount.textContent = notes.length;
  },

  renderPreviewLive() {
    const editor = el('#note-body');
    const preview = el('#note-preview');
    if (!editor || !preview) return;
    
    const md = editor.value;
    if(typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined'){
        let html = marked.parse(md);
        
        // Enhanced wikilink processing [[Note Title]] or [[ID:xxx]]
        html = html.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
          const isIdLink = linkText.startsWith('ID:');
          const displayText = isIdLink ? linkText.substring(3) : linkText;
          return `<a href="#" class="wikilink" data-link="${linkText}" style="color: #60a5fa; text-decoration: underline; cursor: pointer;">${displayText}</a>`;
        });
        
        // Enhanced hashtag processing #tag
        html = html.replace(/(?:^|\s)(#[a-zA-Z0-9_-]+)/g, (match, tag) => {
          return match.replace(tag, `<span class="hashtag" style="color: #34d399; font-weight: 500; cursor: pointer;" data-tag="${tag}">${tag}</span>`);
        });
        
        // Support for highlighted text ==text==
        html = html.replace(/==(.*?)==/g, '<mark style="background: #fbbf24; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</mark>');
        
        preview.innerHTML = DOMPurify.sanitize(html);
        
        // Add click handlers for wikilinks
        preview.querySelectorAll('.wikilink').forEach(link => {
          link.addEventListener('click', async (e) => {
            e.preventDefault();
            const linkText = e.target.getAttribute('data-link');
            await this.handleWikilinkClick(linkText);
          });
        });
        
        // Add click handlers for hashtags
        preview.querySelectorAll('.hashtag').forEach(tag => {
          tag.addEventListener('click', (e) => {
            const tagName = e.target.getAttribute('data-tag');
            this.searchNotesByTag(tagName);
          });
        });
        
    } else {
        preview.textContent = md;
    }
  },

  // Handle wikilink clicks - navigate to linked note or create new one
  async handleWikilinkClick(linkText) {
    const notes = await Store.allNotes();
    let targetNote = null;
    
    if (linkText.startsWith('ID:')) {
      // Direct ID reference
      const id = linkText.substring(3);
      targetNote = notes.find(n => n.id === id);
    } else {
      // Title-based reference
      targetNote = notes.find(n => n.title.toLowerCase() === linkText.toLowerCase());
    }
    
    if (targetNote) {
      // Open existing note
      await this.openNote(targetNote.id);
    } else {
      // Create new note with the linked title
      const newNote = Note.create({ 
        title: linkText.startsWith('ID:') ? 'Untitled' : linkText, 
        body: '', 
        tags: [] 
      });
      await Store.upsert(newNote);
      await this.openNote(newNote.id);
      this.toast(`Created new note: ${linkText}`);
    }
  },

  // Search notes by hashtag
  searchNotesByTag(tagName) {
    const searchInput = el('#search-input');
    if (searchInput) {
      searchInput.value = tagName;
      // Trigger search
      const event = new Event('input');
      searchInput.dispatchEvent(event);
    }
    this.toast(`Searching for ${tagName}`);
  },

  // Add highlighter feature - wrap selected text with ==highlights==
  addHighlight() {
    const editor = el('#note-body');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    if (selectedText) {
      const beforeText = editor.value.substring(0, start);
      const afterText = editor.value.substring(end);
      const highlightedText = `==${selectedText}==`;
      
      editor.value = beforeText + highlightedText + afterText;
      
      // Position cursor after the highlight
      const newCursorPos = start + highlightedText.length;
      editor.setSelectionRange(newCursorPos, newCursorPos);
      editor.focus();
      
      // Trigger input event for live preview
      editor.dispatchEvent(new Event('input'));
      
      this.toast('Text highlighted');
    } else {
      this.toast('Please select text to highlight');
    }
  },

  async renderTagManager() {
      const notes = await Store.allNotes();
      const tagBox = el('#allTagsList');
      if (!tagBox) return;
      tagBox.innerHTML = '';
      const counts = {};
      for (const n of notes) for (const t of (n.tags || [])) counts[t] = (counts[t] || 0) + 1;
      const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      for (const [t, c] of items) {
          const div = document.createElement('div');
          div.className = 'flex justify-between items-center p-2 hover:bg-gray-700 rounded';
          div.innerHTML = `<span>${t}</span><span class="text-sm text-gray-400 bg-gray-600 px-2 rounded-full">${c}</span>`;
          tagBox.appendChild(div);
      }
      const totalTagCount = el('#totalTagCount');
      if(totalTagCount) totalTagCount.textContent = items.length;
  },
  
  async createNewTagFromManager() {
      const newTagInput = el('#newTagInput');
      if (!newTagInput || !newTagInput.value.trim()) return;
      let tagName = newTagInput.value.trim();
      if (!tagName.startsWith('#')) tagName = '#' + tagName;
      console.log(`New tag created: ${tagName}`);
      newTagInput.value = '';
      await this.renderTagManager();
      toast(`Tag ${tagName} created`);
  },

  async seed() {
    console.log('Seeding database...');
    const a = Note.create({ title: 'Welcome to Mahart Notes', tags: ['#welcome'], body: 'This is your first note. Select it from the list on the left.\n\n## Color-coded Notes\nYou can now assign colors to notes using the color button in the editor header. This helps organize your thoughts visually!', color: '#3B82F6' });
    const b = Note.create({ title: 'How to use', tags: ['#guide'], body: '## Linking\nLink notes with [[Title]].\n\n## Tags\nAdd tags with #tags.\n\n## Graph Views\nVisit the Graph page to see your notes connected by tags or colors!', color: '#10B981' });
    const c = Note.create({ title: 'Advanced Features', tags: ['#features', '#advanced'], body: '## New in v2.1\n\n- **Enhanced Search**: Use advanced filters and search operators\n- **Analytics Dashboard**: Track your knowledge growth\n- **Smart Templates**: Quick-start templates for different note types\n- **AI Recommendations**: Get suggestions for connecting ideas\n- **Learning Mode**: Quiz yourself on your notes\n\nExplore these features from the enhanced sidebar!', color: '#8B5CF6' });
    const all = [a, b, c];
    for (const n of all) Note.computeLinks(n, all);
    await Store.saveNotes(all);
  },
};
