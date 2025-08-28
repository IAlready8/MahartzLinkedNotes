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
    const editor = el('#editor');
    
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
    const editor = el('#editor');
    const title = el('#title');
    
    if(saveBtn) saveBtn.onclick = () => this.save();
    if(editor) {
      editor.addEventListener('input', debounce(() => {
        const dirty = el('#dirty');
        if(dirty) dirty.classList.remove('hidden');
        this.renderPreviewLive();
      }, 250));
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

    // Bind filter buttons
    const filterButtons = els('#page-search .flex button');
    filterButtons.forEach(btn => {
      btn.onclick = () => {
        filterButtons.forEach(b => b.className = 'px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600');
        btn.className = 'px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700';
        this.setSearchFilter(btn.textContent);
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
    const templateButtons = els('#page-templates .bg-gray-800 button');
    templateButtons.forEach(btn => {
      btn.onclick = () => {
        const templateCard = btn.closest('.bg-gray-800');
        const templateName = templateCard.querySelector('h3').textContent;
        this.applyTemplate(templateName);
      };
    });
  },

  bindPresentationsPageEvents() {
    const generateBtn = el('#page-presentations button');
    if (generateBtn && generateBtn.textContent.includes('Generate')) {
      generateBtn.onclick = () => this.generatePresentation();
    }
  },

  bindExportPageEvents() {
    const exportButtons = els('#page-export button');
    exportButtons.forEach(btn => {
      if (btn.textContent.includes('Markdown')) {
        btn.onclick = () => this.exportMarkdown();
      } else if (btn.textContent.includes('JSON')) {
        btn.onclick = () => this.exportJSON();
      } else if (btn.textContent.includes('PDF')) {
        btn.onclick = () => this.exportPDF();
      }
    });
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
    const applyButtons = els('#page-recommendations button');
    applyButtons.forEach(btn => {
      if (btn.textContent === 'Apply') {
        btn.onclick = () => {
          const recommendation = btn.closest('.bg-gray-700');
          this.applyRecommendation(recommendation);
        };
      } else if (btn.textContent === 'Dismiss') {
        btn.onclick = () => {
          const recommendation = btn.closest('.bg-gray-700');
          this.dismissRecommendation(recommendation);
        };
      }
    });
  },

  bindLearningPageEvents() {
    const answerButtons = els('#page-learning .bg-gray-600');
    answerButtons.forEach(btn => {
      btn.onclick = () => this.selectAnswer(btn);
    });

    const navigationButtons = els('#page-learning .flex button');
    navigationButtons.forEach(btn => {
      if (btn.textContent === 'Previous') {
        btn.onclick = () => this.previousQuestion();
      } else if (btn.textContent === 'Next') {
        btn.onclick = () => this.nextQuestion();
      }
    });
  },

  bindWorkspacePageEvents() {
    const switchButtons = els('#page-workspace button');
    switchButtons.forEach(btn => {
      if (btn.textContent === 'Switch') {
        btn.onclick = () => {
          const workspace = btn.closest('.bg-gray-700').querySelector('h4').textContent;
          this.switchWorkspace(workspace);
        };
      } else if (btn.textContent === 'Create Workspace') {
        btn.onclick = () => this.createWorkspace();
      }
    });
  },

  bindThemesPageEvents() {
    const themeOptions = els('#page-themes .cursor-pointer');
    themeOptions.forEach(option => {
      option.onclick = () => {
        const themeName = option.querySelector('h4').textContent;
        this.applyTheme(themeName);
      };
    });

    const customThemeBtn = el('#page-themes button');
    if (customThemeBtn && customThemeBtn.textContent.includes('Apply Custom Theme')) {
      customThemeBtn.onclick = () => this.applyCustomTheme();
    }
  },

  bindPluginsPageEvents() {
    const pluginButtons = els('#page-plugins button');
    pluginButtons.forEach(btn => {
      if (btn.textContent === 'Configure') {
        btn.onclick = () => {
          const plugin = btn.closest('.flex').querySelector('h4').textContent;
          this.configurePlugin(plugin);
        };
      } else if (btn.textContent === 'Activate') {
        btn.onclick = () => {
          const plugin = btn.closest('.flex').querySelector('h4').textContent;
          this.activatePlugin(plugin);
        };
      } else if (btn.textContent === 'Install') {
        btn.onclick = () => {
          const plugin = btn.closest('.border').querySelector('h4').textContent;
          this.installPlugin(plugin);
        };
      }
    });
  },

  // --- PAGE ACTION METHODS ---

  performAdvancedSearch(query) {
    const resultsContainer = el('#search-results');
    if (!resultsContainer || !query.trim()) {
      if (resultsContainer) resultsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Enter a search term to see results</p>';
      return;
    }
    
    if (typeof AdvancedSearch !== 'undefined') {
      AdvancedSearch.performSearch(query);
    } else {
      // Fallback to basic search
      this.performBasicSearch(query, resultsContainer);
    }
  },

  async performBasicSearch(query, container) {
    const notes = await Store.allNotes();
    const results = notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.body.toLowerCase().includes(query.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    if (results.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">No results found</p>';
      return;
    }

    const html = results.map(note => `
      <div class="p-3 hover:bg-gray-700 rounded cursor-pointer border-b border-gray-700" onclick="UI.openNoteFromSearch('${note.id}')">
        <h4 class="font-medium text-white">${note.title}</h4>
        <p class="text-gray-300 text-sm mt-1 line-clamp-2">${note.body.substring(0, 150)}...</p>
        <div class="flex gap-1 mt-2">
          ${note.tags.map(tag => `<span class="text-xs bg-gray-600 px-2 py-1 rounded">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  },

  openNoteFromSearch(noteId) {
    window.location.hash = '#/';
    setTimeout(() => this.openNote(noteId), 100);
  },

  setSearchFilter(filter) {
    console.log(`Setting search filter: ${filter}`);
    // Implementation depends on AdvancedSearch module
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
        const editor = el('#editor');
        const title = el('#title');
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

  generatePresentation() {
    console.log('Generating presentation...');
    if (typeof PresentationGenerator !== 'undefined') {
      PresentationGenerator.generate();
    } else {
      alert('Presentation generator not available yet');
    }
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

  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  selectAnswer(button) {
    // Remove selection from other buttons
    const allAnswers = els('#page-learning .bg-gray-600');
    allAnswers.forEach(btn => {
      btn.className = 'w-full p-3 text-left bg-gray-600 hover:bg-gray-500 rounded transition-colors text-white';
    });
    
    // Highlight selected answer
    button.className = 'w-full p-3 text-left bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white';
  },

  previousQuestion() {
    console.log('Previous question');
  },

  nextQuestion() {
    console.log('Next question');
  },

  switchWorkspace(workspaceName) {
    console.log(`Switching to workspace: ${workspaceName}`);
    const currentWorkspace = el('#current-workspace');
    if (currentWorkspace) currentWorkspace.textContent = workspaceName;
    toast(`Switched to ${workspaceName}`);
  },

  createWorkspace() {
    const nameInput = el('#page-workspace input[type="text"]');
    const descInput = el('#page-workspace textarea');
    
    if (nameInput && nameInput.value.trim()) {
      console.log(`Creating workspace: ${nameInput.value}`);
      toast('Workspace created');
      nameInput.value = '';
      if (descInput) descInput.value = '';
    }
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

  configurePlugin(pluginName) {
    console.log(`Configuring plugin: ${pluginName}`);
    alert(`Configure ${pluginName} - Settings panel would open here`);
  },

  activatePlugin(pluginName) {
    console.log(`Activating plugin: ${pluginName}`);
    const button = event.target;
    button.textContent = 'Configure';
    button.className = 'px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500';
    
    // Update status
    const statusSpan = button.parentElement.querySelector('span');
    if (statusSpan) {
      statusSpan.textContent = 'Active';
      statusSpan.className = 'px-2 py-1 bg-green-600 text-white text-xs rounded';
    }
    
    toast(`${pluginName} activated`);
  },

  installPlugin(pluginName) {
    console.log(`Installing plugin: ${pluginName}`);
    const button = event.target;
    button.textContent = 'Installed';
    button.disabled = true;
    button.className = 'w-full py-1 bg-green-600 text-white text-xs rounded cursor-not-allowed';
    toast(`${pluginName} installed`);
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
    const editor = el('#editor');
    const preview = el('#preview');
    if (!editor || !preview) return;
    
    const md = editor.value;
    if(typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined'){
        preview.innerHTML = DOMPurify.sanitize(marked.parse(md));
    } else {
        preview.textContent = md;
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
    const all = [a, b];
    for (const n of all) Note.computeLinks(n, all);
    await Store.saveNotes(all);
  },
};