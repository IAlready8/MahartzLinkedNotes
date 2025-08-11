/* themes.js — Advanced theming system with custom themes */

const Themes = {
  // Available themes
  themes: {
    dark: {
      id: 'dark',
      name: 'Dark',
      description: 'Default dark theme',
      isDefault: true,
      colors: {
        bg: '#0f1115',
        panel: '#151922',
        muted: '#8b93a5',
        text: '#e7ecf5',
        accent: '#6ee7ff',
        accent2: '#9a7cff',
        success: '#00d18f',
        warning: '#ffd166',
        danger: '#ef476f',
        border: '#1f2434'
      }
    },
    light: {
      id: 'light',
      name: 'Light',
      description: 'Clean light theme',
      isDefault: false,
      colors: {
        bg: '#ffffff',
        panel: '#f8f9fa',
        muted: '#6c757d',
        text: '#212529',
        accent: '#0d6efd',
        accent2: '#6f42c1',
        success: '#198754',
        warning: '#ffc107',
        danger: '#dc3545',
        border: '#dee2e6'
      }
    },
    solarized: {
      id: 'solarized',
      name: 'Solarized',
      description: 'Solarized color scheme',
      isDefault: false,
      colors: {
        bg: '#002b36',
        panel: '#073642',
        muted: '#586e75',
        text: '#93a1a1',
        accent: '#268bd2',
        accent2: '#d33682',
        success: '#859900',
        warning: '#b58900',
        danger: '#dc322f',
        border: '#073642'
      }
    },
    dracula: {
      id: 'dracula',
      name: 'Dracula',
      description: 'Dracula theme',
      isDefault: false,
      colors: {
        bg: '#282a36',
        panel: '#44475a',
        muted: '#6272a4',
        text: '#f8f8f2',
        accent: '#50fa7b',
        accent2: '#bd93f9',
        success: '#50fa7b',
        warning: '#f1fa8c',
        danger: '#ff5555',
        border: '#44475a'
      }
    },
    monokai: {
      id: 'monokai',
      name: 'Monokai',
      description: 'Monokai theme',
      isDefault: false,
      colors: {
        bg: '#272822',
        panel: '#3e3d32',
        muted: '#75715e',
        text: '#f8f8f2',
        accent: '#a6e22e',
        accent2: '#ae81ff',
        success: '#a6e22e',
        warning: '#e6db74',
        danger: '#f92672',
        border: '#3e3d32'
      }
    },
    nord: {
      id: 'nord',
      name: 'Nord',
      description: 'Nord theme',
      isDefault: false,
      colors: {
        bg: '#2e3440',
        panel: '#3b4252',
        muted: '#4c566a',
        text: '#eceff4',
        accent: '#88c0d0',
        accent2: '#b48ead',
        success: '#a3be8c',
        warning: '#ebcb8b',
        danger: '#bf616a',
        border: '#4c566a'
      }
    }
  },
  
  // Custom themes
  customThemes: new Map(),
  
  // Current theme
  currentTheme: 'dark',
  
  // Theme preferences
  preferences: {
    fontSize: 15,
    lineHeight: 1.5,
    borderRadius: 14,
    animationSpeed: 1,
    highContrast: false
  },
  
  // Initialize themes system
  async init() {
    // Load saved theme
    await this.loadTheme();
    
    // Load custom themes
    await this.loadCustomThemes();
    
    // Load preferences
    await this.loadPreferences();
    
    // Apply theme
    this.applyTheme();
    
    // Initialize UI
    this.initUI();
  },
  
  // Load theme from storage
  async loadTheme() {
    try {
      const savedTheme = await localforage.getItem('currentTheme');
      if (savedTheme && (this.themes[savedTheme] || this.customThemes.has(savedTheme))) {
        this.currentTheme = savedTheme;
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  },
  
  // Save theme to storage
  async saveTheme() {
    try {
      await localforage.setItem('currentTheme', this.currentTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },
  
  // Load custom themes from storage
  async loadCustomThemes() {
    try {
      const savedThemes = await localforage.getItem('customThemes') || {};
      Object.entries(savedThemes).forEach(([id, theme]) => {
        this.customThemes.set(id, theme);
      });
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }
  },
  
  // Save custom themes to storage
  async saveCustomThemes() {
    try {
      const themesObj = {};
      this.customThemes.forEach((theme, id) => {
        themesObj[id] = theme;
      });
      await localforage.setItem('customThemes', themesObj);
    } catch (error) {
      console.error('Failed to save custom themes:', error);
    }
  },
  
  // Load preferences from storage
  async loadPreferences() {
    try {
      const savedPrefs = await localforage.getItem('themePreferences');
      if (savedPrefs) {
        this.preferences = { ...this.preferences, ...savedPrefs };
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  },
  
  // Save preferences to storage
  async savePreferences() {
    try {
      await localforage.setItem('themePreferences', this.preferences);
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  },
  
  // Initialize UI components
  initUI() {
    // Add theme selector to settings
    this.addThemeSelector();
  },
  
  // Add theme selector to settings
  addThemeSelector() {
    const settingsForm = document.querySelector('#settings form');
    if (!settingsForm) return;
    
    // Create theme section
    const themeSection = document.createElement('div');
    themeSection.className = 'settings-section';
    themeSection.innerHTML = `
      <hr class="sep"/>
      <h3>Appearance</h3>
      <div class="theme-selector">
        <div class="theme-options">
          ${Object.values(this.themes).map(theme => this.renderThemeOption(theme)).join('')}
          ${Array.from(this.customThemes.values()).map(theme => this.renderThemeOption(theme)).join('')}
        </div>
        <div class="theme-actions">
          <button id="createThemeBtn" class="btn btn-small">Create Custom Theme</button>
          <button id="themeSettingsBtn" class="btn btn-small">Theme Settings</button>
        </div>
      </div>
    `;
    
    // Insert before the last element (close button)
    const lastElement = settingsForm.lastElementChild;
    settingsForm.insertBefore(themeSection, lastElement);
    
    // Bind events
    this.bindThemeSelection();
    
    const createBtn = document.getElementById('createThemeBtn');
    const settingsBtn = document.getElementById('themeSettingsBtn');
    
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateThemeModal());
    }
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showThemeSettings());
    }
  },
  
  // Render theme option
  renderThemeOption(theme) {
    const isActive = theme.id === this.currentTheme;
    const isCustom = !theme.isDefault;
    
    return `
      <div class="theme-option ${isActive ? 'active' : ''}" data-theme-id="${theme.id}">
        <div class="theme-preview" style="background: ${theme.colors.bg}; border: 1px solid ${theme.colors.border}">
          <div class="preview-panel" style="background: ${theme.colors.panel}"></div>
          <div class="preview-accent" style="background: ${theme.colors.accent}"></div>
        </div>
        <div class="theme-info">
          <div class="theme-name">${theme.name}</div>
          <div class="theme-description">${theme.description}</div>
          ${isCustom ? '<div class="theme-tag">Custom</div>' : ''}
        </div>
        ${isActive ? '<div class="theme-active">Active</div>' : ''}
      </div>
    `;
  },
  
  // Bind theme selection events
  bindThemeSelection() {
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        const themeId = option.dataset.themeId;
        this.switchTheme(themeId);
      });
    });
  },
  
  // Switch to theme
  async switchTheme(themeId) {
    if (!this.themes[themeId] && !this.customThemes.has(themeId)) {
      toast('Theme not found');
      return;
    }
    
    this.currentTheme = themeId;
    await this.saveTheme();
    this.applyTheme();
    
    toast(`Switched to ${this.getCurrentTheme().name} theme`);
  },
  
  // Apply current theme
  applyTheme() {
    const theme = this.getCurrentTheme();
    if (!theme) return;
    
    // Update CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Update preferences
    root.style.fontSize = `${this.preferences.fontSize}px`;
    root.style.lineHeight = this.preferences.lineHeight;
    root.style.setProperty('--br', `${this.preferences.borderRadius}px`);
    
    // Update high contrast
    if (this.preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  },
  
  // Get current theme
  getCurrentTheme() {
    return this.themes[this.currentTheme] || this.customThemes.get(this.currentTheme) || this.themes.dark;
  },
  
  // Show create theme modal
  showCreateThemeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 600px;">
        <div class="modal-header">
          <h2>Create Custom Theme</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="createThemeForm">
            <div class="form-group">
              <label>Theme Name</label>
              <input type="text" id="themeName" class="form-control" required>
            </div>
            
            <div class="theme-colors">
              <h3>Colors</h3>
              ${this.renderColorPickers()}
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn">Create Theme</button>
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const form = document.getElementById('createThemeForm');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createCustomTheme();
      close();
    });
  },
  
  // Render color pickers
  renderColorPickers() {
    const defaultTheme = this.themes.dark;
    return Object.entries(defaultTheme.colors).map(([key, value]) => `
      <div class="form-group">
        <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
        <input type="color" id="color-${key}" class="color-picker" value="${value}">
      </div>
    `).join('');
  },
  
  // Create custom theme
  async createCustomTheme() {
    const nameInput = document.getElementById('themeName');
    if (!nameInput || !nameInput.value.trim()) {
      toast('Please enter a theme name');
      return;
    }
    
    const colors = {};
    Object.keys(this.themes.dark.colors).forEach(key => {
      const picker = document.getElementById(`color-${key}`);
      if (picker) {
        colors[key] = picker.value;
      }
    });
    
    const theme = {
      id: `custom_${Date.now()}`,
      name: nameInput.value.trim(),
      description: 'Custom theme',
      isDefault: false,
      colors: colors
    };
    
    this.customThemes.set(theme.id, theme);
    await this.saveCustomThemes();
    
    // Update UI
    this.updateThemeSelector();
    
    toast('Custom theme created');
  },
  
  // Update theme selector UI
  updateThemeSelector() {
    const themeSelector = document.querySelector('.theme-selector');
    if (!themeSelector) return;
    
    const themeOptions = themeSelector.querySelector('.theme-options');
    if (themeOptions) {
      themeOptions.innerHTML = `
        ${Object.values(this.themes).map(theme => this.renderThemeOption(theme)).join('')}
        ${Array.from(this.customThemes.values()).map(theme => this.renderThemeOption(theme)).join('')}
      `;
      
      this.bindThemeSelection();
    }
  },
  
  // Show theme settings
  showThemeSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>Theme Settings</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="themeSettingsForm">
            <div class="form-group">
              <label>Font Size</label>
              <input type="range" id="fontSize" class="form-control-range" 
                     min="12" max="20" value="${this.preferences.fontSize}">
              <div class="range-value">${this.preferences.fontSize}px</div>
            </div>
            
            <div class="form-group">
              <label>Line Height</label>
              <input type="range" id="lineHeight" class="form-control-range" 
                     min="1.2" max="2.0" step="0.1" value="${this.preferences.lineHeight}">
              <div class="range-value">${this.preferences.lineHeight}</div>
            </div>
            
            <div class="form-group">
              <label>Border Radius</label>
              <input type="range" id="borderRadius" class="form-control-range" 
                     min="0" max="20" value="${this.preferences.borderRadius}">
              <div class="range-value">${this.preferences.borderRadius}px</div>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="highContrast" ${this.preferences.highContrast ? 'checked' : ''}>
                High Contrast Mode
              </label>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn">Save Settings</button>
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const form = document.getElementById('themeSettingsForm');
    
    // Bind range input events
    ['fontSize', 'lineHeight', 'borderRadius'].forEach(id => {
      const input = document.getElementById(id);
      const value = input.nextElementSibling;
      if (input && value) {
        input.addEventListener('input', () => {
          value.textContent = id === 'fontSize' || id === 'borderRadius' 
            ? `${input.value}px` 
            : input.value;
        });
      }
    });
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveThemeSettings();
      close();
    });
  },
  
  // Save theme settings
  async saveThemeSettings() {
    const fontSize = document.getElementById('fontSize');
    const lineHeight = document.getElementById('lineHeight');
    const borderRadius = document.getElementById('borderRadius');
    const highContrast = document.getElementById('highContrast');
    
    if (fontSize) this.preferences.fontSize = parseInt(fontSize.value);
    if (lineHeight) this.preferences.lineHeight = parseFloat(lineHeight.value);
    if (borderRadius) this.preferences.borderRadius = parseInt(borderRadius.value);
    if (highContrast) this.preferences.highContrast = highContrast.checked;
    
    await this.savePreferences();
    this.applyTheme();
    
    toast('Theme settings saved');
  },
  
  // Export theme
  async exportTheme(themeId) {
    const theme = this.themes[themeId] || this.customThemes.get(themeId);
    if (!theme) {
      toast('Theme not found');
      return;
    }
    
    const themeData = {
      ...theme,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, '_')}_theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast('Theme exported');
  },
  
  // Import theme
  async importTheme() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    // Wait for file selection
    const file = await new Promise((resolve, reject) => {
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve(file);
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.oncancel = () => reject(new Error('File selection cancelled'));
      input.click();
    });
    
    try {
      const text = await file.text();
      const themeData = JSON.parse(text);
      
      // Validate theme data
      if (!themeData.id || !themeData.name || !themeData.colors) {
        throw new Error('Invalid theme file');
      }
      
      // Add custom prefix to avoid conflicts
      themeData.id = `imported_${themeData.id}_${Date.now()}`;
      themeData.isDefault = false;
      
      this.customThemes.set(themeData.id, themeData);
      await this.saveCustomThemes();
      
      // Update UI
      this.updateThemeSelector();
      
      toast('Theme imported successfully');
    } catch (error) {
      console.error('Theme import failed:', error);
      toast('Theme import failed');
    }
  },
  
  // Delete custom theme
  async deleteCustomTheme(themeId) {
    if (!this.customThemes.has(themeId)) {
      toast('Theme not found');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this custom theme?')) {
      return;
    }
    
    this.customThemes.delete(themeId);
    await this.saveCustomThemes();
    
    // Switch to default theme if current theme was deleted
    if (this.currentTheme === themeId) {
      this.currentTheme = 'dark';
      await this.saveTheme();
      this.applyTheme();
    }
    
    // Update UI
    this.updateThemeSelector();
    
    toast('Theme deleted');
  },
  
  // Get theme CSS
  getThemeCSS(theme) {
    return `
      :root {
        ${Object.entries(theme.colors).map(([key, value]) => `--${key}: ${value};`).join('\n  ')}
      }
    `;
  },
  
  // Apply theme to specific element
  applyThemeToElement(element, theme) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      element.style.setProperty(`--${key}`, value);
    });
  },
  
  // Get theme preview CSS
  getThemePreviewCSS(theme) {
    return `
      .theme-preview {
        background: ${theme.colors.bg};
        border: 1px solid ${theme.colors.border};
      }
      .preview-panel {
        background: ${theme.colors.panel};
      }
      .preview-accent {
        background: ${theme.colors.accent};
      }
    `;
  },
  
  // Cycle through themes
  async cycleThemes() {
    const allThemes = [...Object.keys(this.themes), ...Array.from(this.customThemes.keys())];
    const currentIndex = allThemes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % allThemes.length;
    const nextTheme = allThemes[nextIndex];
    
    await this.switchTheme(nextTheme);
  },
  
  // Get theme analytics
  getThemeAnalytics() {
    return {
      currentTheme: this.currentTheme,
      totalCustomThemes: this.customThemes.size,
      preferences: { ...this.preferences },
      themeUsage: this.getThemeUsage()
    };
  },
  
  // Get theme usage statistics
  getThemeUsage() {
    // In a real implementation, this would track theme usage
    // For demo, we'll return mock data
    return {
      dark: 45,
      light: 25,
      solarized: 10,
      dracula: 8,
      monokai: 7,
      nord: 5
    };
  }
};