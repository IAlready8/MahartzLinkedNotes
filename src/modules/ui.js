// 🤖 Review: This file was created by refactoring the monolithic app.js.
// It contains the main UI object and its related logic.

import { Store } from './store.js';
import { Graph } from './graph.js';
import { AdvancedSearch } from './advanced-search.js';
import { AdvancedUI } from './advanced-ui.js';
import { AdvancedViz } from './advanced-viz.js';
import { AIAssistant } from './ai-assistant.js';
import { AIKnowledgeDiscovery } from './ai-knowledge-discovery.js';
import { Analytics } from './analytics.js';
import { Collaboration } from './collaboration.js';
import { CommandPaletteExtensions } from './command-palette-extensions.js';
import { CompetitiveImporters } from './competitive-importers.js';
import { DataSync } from './data-sync.js';
import { DynamicDashboards } from './dynamic-dashboards.js';
import { SmartTemplates } from './smart-templates.js';
import { PresentationGenerator } from './presentation-generator.js';
import { Recommendations } from './recommendations.js';
import { LearningMode } from './learning-mode.js';
import { WorkspaceManager } from './workspace-manager.js';
import { ThemeManager } from './themes.js';
import { PluginSystem } from './plugin-system.js';
import { definePage, initRouter } from './router.js';
import { el, els, debounce, nowISO, ULID } from './util.js';
import { ToastManager, LoadingManager, ContextMenu, TooltipManager, ProgressBar, AdvancedSearchUI, KeyboardShortcuts, StatusBar } from './advanced-ui-components.js';

export const UI = {
  state: { currentId: null, autoLink: true, analytics: true, bc: true },
  bc: null,

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
          const workspace = btn.closest('.bg-gray-700').querySelector('h4').textContent.trim();
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
    const themeOptions = els('#page-themes .cursor-pointer');
    themeOptions.forEach(option => {
      option.onclick = () => {
        const themeName = option.querySelector('h4').textContent.trim();
        console.log(`Applying theme: ${themeName}`);
        this.applyTheme(themeName);
        this.updateThemeSelection(option);
      };
    });

    const customThemeBtn = el('#page-themes button');
    if (customThemeBtn && customThemeBtn.textContent.includes('Apply Custom Theme')) {
      customThemeBtn.onclick = () => {
        console.log('Applying custom theme');
        this.applyCustomTheme();
      };
    }

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
    const pluginButtons = els('#page-plugins button');
    pluginButtons.forEach(btn => {
      const buttonText = btn.textContent.trim();
      
      if (buttonText === 'Install Plugin') {
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
        const pluginCard = btn.closest('.border.border-gray-600');
        const plugin = pluginCard.querySelector('h4').textContent.trim();
        console.log(`Installing plugin: ${plugin}`);
        this.installPlugin(plugin);
      };
    });

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
      this.performBasicSearch(query, resultsContainer, filterType);
    }
  },

  async performBasicSearch(query, container, filterType = 'All') {
    let notes = await Store.allNotes();
    
    if (this.searchFilters?.dateRange && this.searchFilters.dateRange !== 'All Time') {
      notes = this.filterNotesByDate(notes, this.searchFilters.dateRange);
    }
    
    if (this.searchFilters?.colors && this.searchFilters.colors.length > 0) {
      notes = notes.filter(note => this.searchFilters.colors.includes(note.color || '#6B7280'));
    }

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
      ` + html;
  },

  openNoteFromSearch(noteId) {
    this.closeModals();
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
      filteredNotes = notes; 
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
    return templates[templateName] || `# ${templateName}

Template content here...`;
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
    
    const checkboxes = els('#presentation-notes-list input[type="checkbox"]:checked');
    const selectedNoteIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedNoteIds.length === 0) {
      toast('Please select at least one note');
      return;
    }

    if (typeof PresentationGenerator !== 'undefined') {
      PresentationGenerator.generate(title, selectedNoteIds);
    } else {
      this.createSimplePresentation(title, selectedNoteIds);
    }
  },

  async createSimplePresentation(title, noteIds) {
    const notes = await Store.allNotes();
    const selectedNotes = notes.filter(note => noteIds.includes(note.id));
    
    const presentationContent = `# ${title}\n\n*Generated on ${new Date().toLocaleDateString()}*\n\n---\n\n${selectedNotes.map((note, index) => `\n## Slide ${index + 1}: ${note.title}\n\n${note.body}\n\n---\n`).join('\n')}\n\n## Thank You\n\n*Presentation created from ${selectedNotes.length} notes*\n`;

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
    }
  },

  exportPDF() {
    if (typeof DataManagement !== 'undefined') {
      DataManagement.exportPDF();
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
    const allAnswers = els('#page-learning .space-y-3 button');
    allAnswers.forEach(btn => {
      btn.className = 'w-full p-3 text-left bg-gray-600 hover:bg-gray-500 rounded transition-colors text-white';
    });
    
    button.className = 'w-full p-3 text-left bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white';
    
    this.quizState.selectedAnswers[this.quizState.currentQuestion] = answerIndex;
    
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
    }
  },

  updateQuizDisplay() {
    const questionText = el('#page-learning h4');
    if (questionText) {
      questionText.textContent = `Question ${this.quizState.currentQuestion + 1} of ${this.quizState.totalQuestions}`;
    }

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

    const answerButtons = els('#page-learning .space-y-3 button');
    answerButtons.forEach(btn => {
      btn.className = 'w-full p-3 text-left bg-gray-600 hover:bg-gray-500 rounded transition-colors text-white';
    });
  },

  finishQuiz() {
    const totalAnswered = Object.keys(this.quizState.selectedAnswers).length;
    toast(`Quiz completed! You answered ${totalAnswered} out of ${this.quizState.totalQuestions} questions.`);
    
    this.quizState = null;
    this.updateQuizDisplay();
  },

  loadRecommendations() {
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
    
    this.bindRecommendationsPageEvents();
  },

  applyRecommendation(element, type) {
    console.log(`Applying recommendation: ${type}`);
    
    element.style.transform = 'scale(0.95)';
    element.style.opacity = '0.7';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '0.5';
      
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
    this.updateWorkspaceStats();
  },

  async updateWorkspaceStats() {
    const notes = await Store.allNotes();
    const workspaceCards = els('#page-workspace .bg-gray-700');
    
    workspaceCards.forEach(card => {
      const statsElement = card.querySelector('.text-gray-400');
      if (statsElement && statsElement.textContent.includes('•')) {
        statsElement.textContent = `Personal knowledge base • ${notes.length} notes`;
      }
    });
  },

  switchWorkspace(workspaceName) {
    console.log(`Switching to workspace: ${workspaceName}`);
    
    const workspaceCards = els('#page-workspace .bg-gray-700');
    workspaceCards.forEach(card => {
      const cardTitle = card.querySelector('h4').textContent.trim();
      const statusSpan = card.querySelector('span');
      const button = card.querySelector('button');
      
      if (cardTitle === workspaceName) {
        card.className = 'bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500';
        if (statusSpan) {
          statusSpan.textContent = 'Active';
          statusSpan.className = 'px-2 py-1 bg-blue-600 text-white text-xs rounded';
        }
        if (button) button.style.display = 'none';
      } else {
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
      
      this.bindWorkspacePageEvents();
    }
    
    toast('Workspace created successfully');
    nameInput.value = '';
    if (descInput) descInput.value = '';
  },

  updateThemeSelection(selectedOption) {
    const allOptions = els('#page-themes .border-2, #page-themes .border');
    allOptions.forEach(option => {
      if (option.classList.contains('border-2')) {
        option.className = option.className.replace('border-2 border-blue-500', 'border border-gray-600');
      }
    });
    
    selectedOption.className = selectedOption.className.replace('border border-gray-600', 'border-2 border-blue-500');
  },

  previewCustomTheme() {
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
    this.updatePluginStats();
  },

  updatePluginStats() {
    console.log('Plugin data loaded');
  },

  openPluginInstallDialog() {
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
      
      this.bindPluginsPageEvents();
    }
  },

  closePluginDialog() {
    const modal = el('#plugin-install-modal');
    if (modal) {
      modal.remove();
    }
  }
};
