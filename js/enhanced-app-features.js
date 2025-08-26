/* Enhanced App Features Module */

// Extend the UI object with enhanced functionality
Object.assign(UI, {
  
  // Enhanced router setup with all new pages
  setupEnhancedRouter() {
    // Core pages
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
    
    // System
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

  // Enhanced global handlers with keyboard shortcuts
  bindEnhancedGlobalHandlers() {
    window.addEventListener('keydown', (e) => {
      const isCmd = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      
      if (isCmd && key === 's') { 
        e.preventDefault(); 
        if(window.location.hash === '#/' || window.location.hash === ''){
            this.save(); 
        }
      }
      
      // Global shortcuts
      if (isCmd && key === 'k') {
        e.preventDefault();
        this.showQuickSearch();
      }
      
      if (isCmd && key === 'p') {
        e.preventDefault();
        this.showCommandPalette();
      }
      
      if (isCmd && key === 'n') {
        e.preventDefault();
        this.newNote();
      }
      
      // Navigation shortcuts
      if (isCmd && key === 'e') {
        e.preventDefault();
        window.location.hash = '#/';
      }
      
      if (isCmd && key === 'g') {
        e.preventDefault();
        window.location.hash = '#/graph';
      }
      
      if (isCmd && key === 'f') {
        e.preventDefault();
        window.location.hash = '#/search';
      }
      
      if (isCmd && key === 't') {
        e.preventDefault();
        window.location.hash = '#/tags';
      }
      
      // Escape key handlers
      if (key === 'escape') {
        this.hideAllModals();
      }
    });
    
    // Initialize enhanced sidebar
    this.initEnhancedSidebar();
  },

  // Enhanced sidebar functionality
  initEnhancedSidebar() {
    // Sidebar search button
    const sidebarSearch = el('#sidebar-search');
    if(sidebarSearch) sidebarSearch.onclick = () => this.showQuickSearch();
    
    // Sidebar collapse button
    const sidebarCollapse = el('#sidebar-collapse');
    if(sidebarCollapse) sidebarCollapse.onclick = () => this.toggleSidebar();
    
    // New note button
    const newNoteBtn = el('#new-note-btn');
    if(newNoteBtn) newNoteBtn.onclick = () => this.newNote();
    
    // Command palette button
    const commandBtn = el('#command-palette-btn');
    if(commandBtn) commandBtn.onclick = () => this.showCommandPalette();
    
    // Resize handle functionality
    this.initSidebarResize();
    
    // Update active nav item
    this.updateActiveNavItem();
    
    // Update note counter
    this.updateNoteCounter();
  },
  
  toggleSidebar() {
    const sidebar = el('#main-sidebar');
    if(sidebar) {
      sidebar.classList.toggle('sidebar-collapsed');
      const icon = el('#sidebar-collapse i');
      if(icon) {
        icon.className = sidebar.classList.contains('sidebar-collapsed') ? 
          'fas fa-chevron-right text-xs' : 'fas fa-chevron-left text-xs';
      }
    }
  },
  
  initSidebarResize() {
    const handle = el('#sidebar-resize-handle');
    const sidebar = el('#main-sidebar');
    if(!handle || !sidebar) return;
    
    let isResizing = false;
    
    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    });
    
    function resize(e) {
      if(!isResizing) return;
      const newWidth = e.clientX;
      if(newWidth >= 200 && newWidth <= 400) {
        sidebar.style.width = newWidth + 'px';
      }
    }
    
    function stopResize() {
      isResizing = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }
  },
  
  updateActiveNavItem() {
    const hash = window.location.hash || '#/';
    const navItems = els('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if(item.getAttribute('href') === hash) {
        item.classList.add('active');
      }
    });
  },
  
  async updateNoteCounter() {
    const notes = await Store.allNotes();
    const counter = el('#note-counter');
    if(counter) {
      counter.textContent = `${notes.length} notes`;
    }
  },

  // Modal functionality
  showQuickSearch() {
    const modal = el('#quick-search-modal');
    const input = el('#quick-search-input');
    if(modal && input) {
      modal.classList.remove('hidden');
      input.focus();
      this.bindQuickSearchEvents();
    }
  },
  
  showCommandPalette() {
    const modal = el('#command-palette-modal');
    const input = el('#command-palette-input');
    if(modal && input) {
      modal.classList.remove('hidden');
      input.focus();
      this.bindCommandPaletteEvents();
    }
  },
  
  hideAllModals() {
    const modals = els('.fixed.inset-0');
    modals.forEach(modal => modal.classList.add('hidden'));
  },
  
  bindQuickSearchEvents() {
    const input = el('#quick-search-input');
    const results = el('#quick-search-results');
    
    if(input && results) {
      input.oninput = debounce(async () => {
        const query = input.value.trim();
        if(!query) {
          results.innerHTML = '<div class="p-4 text-gray-400 text-center">Start typing to search...</div>';
          return;
        }
        
        const searchResults = await this.performQuickSearch(query);
        this.renderQuickSearchResults(searchResults);
      }, 200);
    }
    
    // Close on click outside
    const modal = el('#quick-search-modal');
    if(modal) {
      modal.onclick = (e) => {
        if(e.target === modal) this.hideAllModals();
      };
    }
  },
  
  bindCommandPaletteEvents() {
    const input = el('#command-palette-input');
    const results = el('#command-palette-results');
    
    if(input && results) {
      input.oninput = debounce(() => {
        const query = input.value.trim().toLowerCase();
        this.renderCommandPaletteResults(query);
      }, 100);
    }
    
    // Close on click outside
    const modal = el('#command-palette-modal');
    if(modal) {
      modal.onclick = (e) => {
        if(e.target === modal) this.hideAllModals();
      };
    }
  },
  
  async performQuickSearch(query) {
    const notes = await Store.allNotes();
    return notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.body.toLowerCase().includes(query.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);
  },
  
  renderQuickSearchResults(results) {
    const container = el('#quick-search-results');
    if(!container) return;
    
    if(results.length === 0) {
      container.innerHTML = '<div class="p-4 text-gray-400 text-center">No results found</div>';
      return;
    }
    
    container.innerHTML = results.map(note => `
      <div class="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0" onclick="UI.openNoteFromSearch('${note.id}')">
        <div class="font-medium text-white">${note.title}</div>
        <div class="text-sm text-gray-400 mt-1">${note.body.slice(0, 100)}${note.body.length > 100 ? '...' : ''}</div>
        ${note.tags.length > 0 ? `<div class="flex gap-1 mt-2">${note.tags.map(tag => `<span class="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">${tag}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');
  },
  
  renderCommandPaletteResults(query) {
    const container = el('#command-palette-results');
    if(!container) return;
    
    const commands = [
      { name: 'New Note', action: 'newNote', icon: 'fas fa-plus', shortcut: '⌘N', color: 'text-blue-500' },
      { name: 'Quick Search', action: 'showQuickSearch', icon: 'fas fa-search', shortcut: '���K', color: 'text-green-500' },
      { name: 'Go to Graph', action: () => window.location.hash = '#/graph', icon: 'fas fa-project-diagram', shortcut: '⌘G', color: 'text-purple-500' },
      { name: 'Go to Analytics', action: () => window.location.hash = '#/analytics', icon: 'fas fa-chart-line', shortcut: '', color: 'text-yellow-500' },
      { name: 'Export All Notes', action: 'exportAllNotes', icon: 'fas fa-download', shortcut: '', color: 'text-red-500' },
      { name: 'Toggle Sidebar', action: 'toggleSidebar', icon: 'fas fa-bars', shortcut: '', color: 'text-gray-500' },
    ];
    
    const filtered = query ? commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query)
    ) : commands;
    
    container.innerHTML = `
      <div class="p-4">
        <div class="space-y-2">
          ${filtered.map(cmd => `
            <div class="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center" onclick="UI.executeCommand('${cmd.action}')">
              <i class="${cmd.icon} w-6 mr-3 ${cmd.color}"></i>
              <span class="text-white">${cmd.name}</span>
              ${cmd.shortcut ? `<kbd class="ml-auto text-xs bg-gray-700 px-2 py-1 rounded">${cmd.shortcut}</kbd>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  executeCommand(action) {
    this.hideAllModals();
    if(typeof action === 'function') {
      action();
    } else if(typeof this[action] === 'function') {
      this[action]();
    }
  },
  
  async openNoteFromSearch(noteId) {
    this.hideAllModals();
    window.location.hash = '#/';
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.openNote(noteId);
  },

  // NEW PAGE INITIALIZERS
  async initSearchPage() {
    console.log('Initializing Search Page...');
    this.bindSearchPageEvents();
    await this.renderAdvancedSearch();
  },
  
  async initAnalyticsPage() {
    console.log('Initializing Analytics Page...');
    await this.renderAnalyticsDashboard();
  },
  
  async initInsightsPage() {
    console.log('Initializing Insights Page...');
    await this.renderInsights();
  },
  
  async initTimelinePage() {
    console.log('Initializing Timeline Page...');
    await this.renderTimeline();
  },
  
  async initTemplatesPage() {
    console.log('Initializing Templates Page...');
    this.bindTemplatesPageEvents();
  },
  
  async initPresentationsPage() {
    console.log('Initializing Presentations Page...');
    this.bindPresentationsPageEvents();
  },
  
  async initExportPage() {
    console.log('Initializing Export Page...');
    this.bindExportPageEvents();
  },
  
  async initBackupPage() {
    console.log('Initializing Backup Page...');
    this.bindBackupPageEvents();
  },
  
  async initRecommendationsPage() {
    console.log('Initializing Recommendations Page...');
    await this.renderRecommendations();
  },
  
  async initLearningPage() {
    console.log('Initializing Learning Page...');
    this.bindLearningPageEvents();
  },
  
  async initWorkspacePage() {
    console.log('Initializing Workspace Page...');
    this.bindWorkspacePageEvents();
    await this.renderWorkspaces();
  },
  
  async initThemesPage() {
    console.log('Initializing Themes Page...');
    this.bindThemesPageEvents();
  },
  
  async initPluginsPage() {
    console.log('Initializing Plugins Page...');
    this.bindPluginsPageEvents();
    await this.renderPlugins();
  },

  // ENHANCED REFRESH FUNCTIONALITY
  async enhancedRefreshCurrentPage() {
    const path = window.location.hash || '#/';
    console.log(`Refreshing page: ${path}`);
    
    // Update active nav item
    this.updateActiveNavItem();
    
    // Refresh page-specific content
    if (path === '#/' || path === '') await this.refreshHomePage();
    if (path === '#/tags') await this.renderTagManager();
    if (path === '#/graph') await this.renderGraph();
    if (path === '#/analytics') await this.renderAnalyticsDashboard();
    if (path === '#/search') await this.renderAdvancedSearch();
    if (path === '#/insights') await this.renderInsights();
    if (path === '#/timeline') await this.renderTimeline();
    if (path === '#/recommendations') await this.renderRecommendations();
    if (path === '#/workspace') await this.renderWorkspaces();
    if (path === '#/plugins') await this.renderPlugins();
  },

  // PAGE RENDERING METHODS
  bindSearchPageEvents() {
    const searchInput = el('#advanced-search-input');
    if(searchInput) {
      searchInput.oninput = debounce(async () => {
        await this.performAdvancedSearch();
      }, 300);
    }
  },
  
  async renderAdvancedSearch() {
    const notes = await Store.allNotes();
    console.log(`Advanced search initialized with ${notes.length} notes`);
  },
  
  async renderAnalyticsDashboard() {
    const notes = await Store.allNotes();
    
    // Update KPIs
    const totalNotes = el('#total-notes-count');
    const totalLinks = el('#total-links-count');
    const totalTags = el('#total-tags-count');
    const weekActivity = el('#week-activity');
    
    if(totalNotes) totalNotes.textContent = notes.length;
    if(totalLinks) {
      const linkCount = notes.reduce((acc, note) => acc + (note.links || []).length, 0);
      totalLinks.textContent = linkCount;
    }
    if(totalTags) {
      const uniqueTags = new Set();
      notes.forEach(note => note.tags.forEach(tag => uniqueTags.add(tag)));
      totalTags.textContent = uniqueTags.size;
    }
    if(weekActivity) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentNotes = notes.filter(note => (note.updatedAt || note.createdAt) > weekAgo);
      weekActivity.textContent = recentNotes.length;
    }
    
    // Render top tags
    this.renderTopTagsList();
  },
  
  async renderTopTagsList() {
    const notes = await Store.allNotes();
    const tagCounts = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const container = el('#top-tags-list');
    if(container) {
      container.innerHTML = sortedTags.map(([tag, count]) => `
        <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
          <span class="text-white">${tag}</span>
          <span class="text-gray-400 text-sm">${count} notes</span>
        </div>
      `).join('') || '<p class="text-gray-400">No tags found</p>';
    }
  },
  
  async renderInsights() {
    console.log('Rendering AI insights and recommendations...');
  },
  
  async renderTimeline() {
    const notes = await Store.allNotes();
    const sortedNotes = notes.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    
    const container = el('#timeline-content');
    if(container) {
      container.innerHTML = sortedNotes.slice(0, 20).map(note => {
        const date = new Date(note.updatedAt || note.createdAt);
        return `
          <div class="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
            <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-medium text-white">${note.title}</h4>
                <span class="text-xs text-gray-400">${date.toLocaleDateString()}</span>
              </div>
              <p class="text-gray-300 text-sm mt-1">${note.body.slice(0, 100)}${note.body.length > 100 ? '...' : ''}</p>
              ${note.tags.length > 0 ? `<div class="flex gap-1 mt-2">${note.tags.map(tag => `<span class="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">${tag}</span>`).join('')}</div>` : ''}
            </div>
          </div>
        `;
      }).join('') || '<p class="text-gray-400 text-center py-8">No activity to show</p>';
    }
  },
  
  bindTemplatesPageEvents() {
    const templateCards = els('.template-card, [class*="template-card"]');
    templateCards.forEach(card => {
      card.onclick = () => {
        this.useTemplate(card.dataset.template || 'meeting-notes');
      };
    });
  },
  
  useTemplate(templateType) {
    const templates = {
      'meeting-notes': {
        title: 'Meeting Notes - ' + new Date().toLocaleDateString(),
        body: `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n## Action Items\n- [ ] \n\n## Next Steps\n`,
        tags: ['#meeting', '#notes']
      },
      'project-planning': {
        title: 'Project Plan - ' + new Date().toLocaleDateString(),
        body: `# Project Planning\n\n## Overview\n\n## Goals\n- \n\n## Timeline\n\n## Resources\n\n## Risks\n\n## Success Metrics\n`,
        tags: ['#project', '#planning']
      },
      'research-notes': {
        title: 'Research Notes - ' + new Date().toLocaleDateString(),
        body: `# Research Notes\n\n## Topic\n\n## Hypothesis\n\n## Sources\n- \n\n## Findings\n\n## Conclusions\n\n## Further Research\n`,
        tags: ['#research', '#notes']
      }
    };
    
    const template = templates[templateType];
    if(template) {
      this.createNoteFromTemplate(template);
    }
  },
  
  async createNoteFromTemplate(template) {
    const note = Note.create(template);
    await Store.upsert(note);
    window.location.hash = '#/';
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.openNote(note.id);
    toast(`Template "${template.title}" created!`);
  },
  
  bindPresentationsPageEvents() {
    console.log('Presentations page events bound');
  },
  
  bindExportPageEvents() {
    const exportMarkdown = el('[onclick*="Export Markdown"]')?.parentElement?.querySelector('button');
    const exportJson = el('[onclick*="Export JSON"]')?.parentElement?.querySelector('button');
    const exportPdf = el('[onclick*="Export PDF"]')?.parentElement?.querySelector('button');
    
    if(exportMarkdown) exportMarkdown.onclick = () => this.exportMarkdown();
    if(exportJson) exportJson.onclick = () => this.exportJSON();
    if(exportPdf) exportPdf.onclick = () => this.exportPDF();
  },
  
  async exportMarkdown() {
    const notes = await Store.allNotes();
    // Implementation would create markdown files
    toast('Markdown export started...');
  },
  
  async exportJSON() {
    const notes = await Store.allNotes();
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mahart-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('JSON backup downloaded!');
  },
  
  async exportPDF() {
    toast('PDF export feature coming soon...');
  },
  
  bindBackupPageEvents() {
    console.log('Backup page events bound');
  },
  
  async renderRecommendations() {
    console.log('Rendering AI recommendations...');
  },
  
  bindLearningPageEvents() {
    console.log('Learning page events bound');
  },
  
  bindWorkspacePageEvents() {
    console.log('Workspace page events bound');
  },
  
  async renderWorkspaces() {
    console.log('Rendering workspaces...');
  },
  
  bindThemesPageEvents() {
    console.log('Themes page events bound');
  },
  
  bindPluginsPageEvents() {
    console.log('Plugins page events bound');
  },
  
  async renderPlugins() {
    console.log('Rendering plugins...');
  }
});

// Override the original methods
UI.setupRouter = UI.setupEnhancedRouter;
UI.bindGlobalHandlers = UI.bindEnhancedGlobalHandlers;
UI.refreshCurrentPage = UI.enhancedRefreshCurrentPage;

console.log('Enhanced app features loaded');
