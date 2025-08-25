/* theme-editor.js - Theme Editor for Custom Themes */

const ThemeEditor = {
  // Initialize theme editor
  init() {
    // Add theme editor to settings
    this.addThemeEditorToSettings();
  },
  
  // Add theme editor to settings
  addThemeEditorToSettings() {
    // Wait for settings to be available
    const checkSettings = setInterval(() => {
      const settingsForm = document.querySelector('#settings form');
      if (settingsForm) {
        clearInterval(checkSettings);
        this.createThemeEditor(settingsForm);
      }
    }, 100);
  },
  
  // Create theme editor
  createThemeEditor(settingsForm) {
    // Check if theme editor already exists
    if (document.getElementById('themeEditor')) return;
    
    // Create theme editor section
    const themeEditor = document.createElement('div');
    themeEditor.id = 'themeEditor';
    themeEditor.className = 'settings-section';
    themeEditor.innerHTML = `
      <hr class="sep"/>
      <h3>Theme Editor</h3>
      <div class="theme-editor-controls">
        <button id="createCustomTheme" class="btn btn-small">Create Custom Theme</button>
        <button id="editCurrentTheme" class="btn btn-small">Edit Current Theme</button>
      </div>
      <div id="themeEditorPanel" style="display: none; margin-top: 16px; padding: 16px; background: #0b0f18; border: 1px solid #1a2133; border-radius: 8px;">
        <h4 id="editorTitle">Create Custom Theme</h4>
        <div class="form-group">
          <label>Theme Name</label>
          <input type="text" id="themeName" class="form-control" placeholder="My Custom Theme">
        </div>
        <div class="theme-colors-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 16px 0;">
          ${this.renderColorPickers()}
        </div>
        <div class="form-actions">
          <button id="saveTheme" class="btn">Save Theme</button>
          <button id="cancelEdit" class="btn btn-secondary">Cancel</button>
          <button id="deleteTheme" class="btn btn-danger" style="display: none;">Delete Theme</button>
        </div>
      </div>
    `;
    
    // Insert before the last element (close button)
    const lastElement = settingsForm.lastElementChild;
    settingsForm.insertBefore(themeEditor, lastElement);
    
    // Bind events
    this.bindThemeEditorEvents();
  },
  
  // Render color pickers
  renderColorPickers() {
    const colors = [
      { id: 'bg', name: 'Background' },
      { id: 'panel', name: 'Panel' },
      { id: 'muted', name: 'Muted Text' },
      { id: 'text', name: 'Text' },
      { id: 'accent', name: 'Accent' },
      { id: 'accent2', name: 'Accent 2' },
      { id: 'success', name: 'Success' },
      { id: 'warning', name: 'Warning' },
      { id: 'danger', name: 'Danger' },
      { id: 'border', name: 'Border' }
    ];
    
    return colors.map(color => `
      <div class="form-group">
        <label>${color.name}</label>
        <input type="color" id="color-${color.id}" class="color-picker" value="#000000">
      </div>
    `).join('');
  },
  
  // Bind theme editor events
  bindThemeEditorEvents() {
    const createBtn = document.getElementById('createCustomTheme');
    const editBtn = document.getElementById('editCurrentTheme');
    const saveBtn = document.getElementById('saveTheme');
    const cancelBtn = document.getElementById('cancelEdit');
    const deleteBtn = document.getElementById('deleteTheme');
    
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showThemeEditor('create'));
    }
    
    if (editBtn) {
      editBtn.addEventListener('click', () => this.showThemeEditor('edit'));
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCustomTheme());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideThemeEditor());
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteCustomTheme());
    }
  },
  
  // Show theme editor
  showThemeEditor(mode) {
    const panel = document.getElementById('themeEditorPanel');
    const title = document.getElementById('editorTitle');
    const deleteBtn = document.getElementById('deleteTheme');
    const nameInput = document.getElementById('themeName');
    
    if (!panel || !title) return;
    
    if (mode === 'create') {
      title.textContent = 'Create Custom Theme';
      if (deleteBtn) deleteBtn.style.display = 'none';
      if (nameInput) nameInput.value = '';
      this.loadCurrentColors();
    } else {
      title.textContent = 'Edit Current Theme';
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
      if (nameInput) nameInput.value = Themes.getCurrentTheme().name || 'Custom Theme';
      this.loadCurrentColors();
    }
    
    panel.style.display = 'block';
  },
  
  // Hide theme editor
  hideThemeEditor() {
    const panel = document.getElementById('themeEditorPanel');
    if (panel) {
      panel.style.display = 'none';
    }
  },
  
  // Load current colors
  loadCurrentColors() {
    const theme = Themes.getCurrentTheme();
    if (!theme || !theme.colors) return;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      const picker = document.getElementById(`color-${key}`);
      if (picker) {
        picker.value = value;
      }
    });
  },
  
  // Save custom theme
  async saveCustomTheme() {
    const nameInput = document.getElementById('themeName');
    if (!nameInput || !nameInput.value.trim()) {
      toast('Please enter a theme name');
      return;
    }
    
    const colors = {};
    const colorPickers = document.querySelectorAll('.color-picker');
    colorPickers.forEach(picker => {
      const key = picker.id.replace('color-', '');
      colors[key] = picker.value;
    });
    
    const theme = {
      id: `custom_${Date.now()}`,
      name: nameInput.value.trim(),
      description: 'Custom theme',
      isDefault: false,
      colors: colors
    };
    
    // Save to Themes system
    if (typeof Themes !== 'undefined') {
      Themes.customThemes.set(theme.id, theme);
      await Themes.saveCustomThemes();
      
      // Update UI
      Themes.updateThemeSelector();
      
      toast('Custom theme saved');
      this.hideThemeEditor();
    }
  },
  
  // Delete custom theme
  async deleteCustomTheme() {
    const currentTheme = Themes.getCurrentTheme();
    if (!currentTheme || currentTheme.isDefault) {
      toast('Cannot delete default themes');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this custom theme?')) {
      return;
    }
    
    // Remove from Themes system
    if (typeof Themes !== 'undefined') {
      Themes.customThemes.delete(currentTheme.id);
      await Themes.saveCustomThemes();
      
      // Switch to default theme
      Themes.currentTheme = 'dark';
      await Themes.saveTheme();
      Themes.applyTheme();
      
      // Update UI
      Themes.updateThemeSelector();
      
      toast('Theme deleted');
      this.hideThemeEditor();
    }
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeEditor.init());
} else {
  ThemeEditor.init();
}