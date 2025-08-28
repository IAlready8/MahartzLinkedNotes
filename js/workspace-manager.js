/* Workspace Management System */

const WorkspaceManager = {
  currentWorkspace: 'default',
  workspaces: {},
  
  async init() {
    await this.loadWorkspaces();
    this.updateWorkspaceDisplay();
    this.bindWorkspaceEvents();
  },
  
  async loadWorkspaces() {
    try {
      const stored = await localforage.getItem('workspaces');
      if(stored) {
        this.workspaces = stored;
      } else {
        // Create default workspace
        this.workspaces = {
          default: {
            id: 'default',
            name: 'Default Workspace',
            description: 'Personal knowledge base',
            createdAt: new Date().toISOString(),
            noteCount: 0
          }
        };
        await this.saveWorkspaces();
      }
      
      // Load current workspace
      const currentId = localStorage.getItem('currentWorkspace') || 'default';
      this.currentWorkspace = currentId;
    } catch(error) {
      console.error('Failed to load workspaces:', error);
    }
  },
  
  async saveWorkspaces() {
    try {
      await localforage.setItem('workspaces', this.workspaces);
    } catch(error) {
      console.error('Failed to save workspaces:', error);
    }
  },
  
  async createWorkspace(name, description = '') {
    const id = 'ws_' + Date.now();
    const workspace = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
      noteCount: 0
    };
    
    this.workspaces[id] = workspace;
    await this.saveWorkspaces();
    
    return workspace;
  },
  
  async switchWorkspace(workspaceId) {
    if(!this.workspaces[workspaceId]) {
      console.error('Workspace not found:', workspaceId);
      return;
    }
    
    this.currentWorkspace = workspaceId;
    localStorage.setItem('currentWorkspace', workspaceId);
    
    this.updateWorkspaceDisplay();
    
    // Refresh the current page to reflect workspace change
    if(typeof UI !== 'undefined' && UI.refreshCurrentPage) {
      await UI.refreshCurrentPage();
    }
    
    toast(`Switched to ${this.workspaces[workspaceId].name}`);
  },
  
  async deleteWorkspace(workspaceId) {
    if(workspaceId === 'default') {
      toast('Cannot delete the default workspace', 'error');
      return;
    }
    
    if(this.currentWorkspace === workspaceId) {
      await this.switchWorkspace('default');
    }
    
    delete this.workspaces[workspaceId];
    await this.saveWorkspaces();
    
    this.renderWorkspaceList();
    toast('Workspace deleted');
  },
  
  updateWorkspaceDisplay() {
    // Update sidebar workspace indicator
    const workspaceIndicator = el('#current-workspace');
    if(workspaceIndicator) {
      const workspace = this.workspaces[this.currentWorkspace];
      workspaceIndicator.textContent = workspace ? workspace.name : 'Unknown Workspace';
    }
    
    // Update workspace page if active
    if(window.location.hash === '#/workspace') {
      this.renderWorkspaceList();
    }
  },
  
  async updateWorkspaceNoteCount(workspaceId = this.currentWorkspace) {
    if(!this.workspaces[workspaceId]) return;
    
    const notes = await Store.allNotes();
    this.workspaces[workspaceId].noteCount = notes.length;
    await this.saveWorkspaces();
  },
  
  renderWorkspaceList() {
    const container = el('#page-workspace .lg\\:col-span-2 .space-y-3');
    if(!container) return;
    
    container.innerHTML = Object.values(this.workspaces).map(workspace => {
      const isActive = workspace.id === this.currentWorkspace;
      return `
        <div class="bg-gray-700 rounded-lg p-4 ${isActive ? 'border-l-4 border-blue-500' : ''}">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-white">${workspace.name}</h4>
              <p class="text-gray-400 text-sm">${workspace.description} • ${workspace.noteCount || 0} notes</p>
            </div>
            <div class="flex items-center gap-2">
              ${isActive ? 
                '<span class="px-2 py-1 bg-blue-600 text-white text-xs rounded">Active</span>' :
                `<button onclick="WorkspaceManager.switchWorkspace('${workspace.id}')" class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500">Switch</button>`
              }
              ${workspace.id !== 'default' ? 
                `<button onclick="WorkspaceManager.deleteWorkspace('${workspace.id}')" class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Delete</button>` : ''
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  },
  
  bindWorkspaceEvents() {
    // Create workspace form
    const createForm = el('#page-workspace form') || el('#page-workspace .space-y-4');
    if(createForm) {
      const nameInput = createForm.querySelector('input[placeholder*="name"]');
      const descInput = createForm.querySelector('textarea');
      const createBtn = createForm.querySelector('button');
      
      if(createBtn && nameInput) {
        createBtn.onclick = async (e) => {
          e.preventDefault();
          const name = nameInput.value.trim();
          const description = descInput ? descInput.value.trim() : '';
          
          if(!name) {
            toast('Workspace name is required', 'error');
            return;
          }
          
          try {
            await this.createWorkspace(name, description);
            nameInput.value = '';
            if(descInput) descInput.value = '';
            
            this.renderWorkspaceList();
            toast(`Workspace "${name}" created!`);
          } catch(error) {
            toast('Failed to create workspace', 'error');
          }
        };
      }
    }
  },
  
  // Get workspace-specific storage key
  getWorkspaceKey(key) {
    return `${this.currentWorkspace}_${key}`;
  },
  
  // Workspace-aware note storage (extension for Store)
  async getWorkspaceNotes() {
    if(this.currentWorkspace === 'default') {
      return await Store.allNotes();
    }
    
    // For non-default workspaces, filter notes by workspace
    const allNotes = await Store.allNotes();
    return allNotes.filter(note => note.workspace === this.currentWorkspace);
  },
  
  async saveNoteToWorkspace(note) {
    // Add workspace identifier to note
    note.workspace = this.currentWorkspace;
    await Store.upsert(note);
    await this.updateWorkspaceNoteCount();
  }
};

// Theme management system
const ThemeManager = {
  themes: {
    dark: {
      name: 'Dark',
      primary: '#3B82F6',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      description: 'Default dark theme'
    },
    light: {
      name: 'Light',
      primary: '#3B82F6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      description: 'Clean light theme'
    },
    ocean: {
      name: 'Ocean',
      primary: '#0EA5E9',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      description: 'Ocean-inspired blue theme'
    },
    forest: {
      name: 'Forest',
      primary: '#10B981',
      background: '#064E3B',
      surface: '#065F46',
      text: '#ECFDF5',
      description: 'Nature-inspired green theme'
    }
  },
  
  currentTheme: 'dark',
  
  init() {
    this.loadTheme();
    this.bindThemeEvents();
  },
  
  loadTheme() {
    const saved = localStorage.getItem('selectedTheme');
    if(saved && this.themes[saved]) {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);
  },
  
  applyTheme(themeId) {
    const theme = this.themes[themeId];
    if(!theme) return;
    
    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-text', theme.text);
    
    // Update body classes for major theme changes
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);
    
    this.currentTheme = themeId;
    localStorage.setItem('selectedTheme', themeId);
    
    this.updateThemeDisplay();
  },
  
  updateThemeDisplay() {
    // Update theme selection in themes page
    els('.theme-preview').forEach(preview => {
      preview.classList.remove('active');
      const themeId = preview.dataset.theme;
      if(themeId === this.currentTheme) {
        preview.classList.add('active');
      }
    });
  },
  
  bindThemeEvents() {
    // Theme selection
    els('.theme-preview').forEach(preview => {
      preview.onclick = () => {
        const themeId = preview.dataset.theme;
        if(themeId && this.themes[themeId]) {
          this.applyTheme(themeId);
          toast(`Theme changed to ${this.themes[themeId].name}`);
        }
      };
    });
    
    // Custom theme controls
    const customForm = el('#page-themes .space-y-4');
    if(customForm) {
      const applyBtn = customForm.querySelector('button');
      if(applyBtn) {
        applyBtn.onclick = () => this.applyCustomTheme();
      }
    }
  },
  
  applyCustomTheme() {
    const primaryInput = el('#page-themes input[type="color"]:nth-of-type(1)');
    const bgInput = el('#page-themes input[type="color"]:nth-of-type(2)');
    const textInput = el('#page-themes input[type="color"]:nth-of-type(3)');
    
    if(primaryInput && bgInput && textInput) {
      const customTheme = {
        name: 'Custom',
        primary: primaryInput.value,
        background: bgInput.value,
        surface: this.adjustColor(bgInput.value, 10),
        text: textInput.value,
        description: 'Custom user theme'
      };
      
      this.themes.custom = customTheme;
      this.applyTheme('custom');
      toast('Custom theme applied!');
    }
  },
  
  adjustColor(hex, percent) {
    // Utility to lighten/darken colors
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },
  
  cycleTheme() {
    const themeIds = Object.keys(this.themes);
    const currentIndex = themeIds.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const nextTheme = themeIds[nextIndex];
    
    this.applyTheme(nextTheme);
    toast(`Theme: ${this.themes[nextTheme].name}`);
  }
};

// Plugin management system
const PluginManager = {
  plugins: {
    'task-manager': {
      id: 'task-manager',
      name: 'Task Manager',
      description: 'Convert notes to actionable tasks',
      icon: 'fas fa-tasks',
      active: true,
      version: '1.0.0'
    },
    'calendar-integration': {
      id: 'calendar-integration',
      name: 'Calendar Integration',
      description: 'Sync with Google Calendar',
      icon: 'fas fa-calendar',
      active: false,
      version: '1.0.0'
    }
  },
  
  init() {
    this.loadPluginStates();
    this.renderPluginList();
  },
  
  loadPluginStates() {
    const states = localStorage.getItem('pluginStates');
    if(states) {
      const parsed = JSON.parse(states);
      Object.keys(parsed).forEach(id => {
        if(this.plugins[id]) {
          this.plugins[id].active = parsed[id];
        }
      });
    }
  },
  
  savePluginStates() {
    const states = {};
    Object.values(this.plugins).forEach(plugin => {
      states[plugin.id] = plugin.active;
    });
    localStorage.setItem('pluginStates', JSON.stringify(states));
  },
  
  togglePlugin(pluginId) {
    const plugin = this.plugins[pluginId];
    if(!plugin) return;
    
    plugin.active = !plugin.active;
    this.savePluginStates();
    this.renderPluginList();
    
    toast(`Plugin ${plugin.name} ${plugin.active ? 'activated' : 'deactivated'}`);
  },
  
  renderPluginList() {
    const container = el('#page-plugins .space-y-4');
    if(!container) return;
    
    container.innerHTML = Object.values(this.plugins).map(plugin => `
      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-${plugin.active ? 'blue' : 'gray'}-600 rounded-lg flex items-center justify-center mr-3">
            <i class="${plugin.icon} text-white"></i>
          </div>
          <div>
            <h4 class="font-medium text-white">${plugin.name}</h4>
            <p class="text-gray-400 text-sm">${plugin.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 bg-${plugin.active ? 'green' : 'gray'}-600 text-white text-xs rounded">
            ${plugin.active ? 'Active' : 'Inactive'}
          </span>
          <button onclick="PluginManager.togglePlugin('${plugin.id}')" class="px-3 py-1 bg-${plugin.active ? 'red' : 'blue'}-600 text-white text-sm rounded hover:opacity-80">
            ${plugin.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    `).join('');
  }
};

// Initialize all managers
document.addEventListener('DOMContentLoaded', async () => {
  await WorkspaceManager.init();
  ThemeManager.init();
  PluginManager.init();
});

// Make managers globally available
window.WorkspaceManager = WorkspaceManager;
window.ThemeManager = ThemeManager;
window.PluginManager = PluginManager;

// Add keyboard shortcut for theme cycling
document.addEventListener('keydown', (e) => {
  if((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    ThemeManager.cycleTheme();
  }
});

console.log('Workspace and theme managers loaded');
