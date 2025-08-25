/* learning-mode.js - Learning Mode for AI Projects */

const LearningMode = {
  // Learning modes
  modes: {
    'beginner': {
      name: 'Beginner',
      description: 'Simplified explanations with basic concepts',
      complexity: 1
    },
    'intermediate': {
      name: 'Intermediate',
      description: 'Balanced explanations with technical details',
      complexity: 2
    },
    'advanced': {
      name: 'Advanced',
      description: 'Detailed explanations with research references',
      complexity: 3
    }
  },
  
  // Current learning mode
  currentMode: 'intermediate',
  
  // Initialize learning mode
  init() {
    // Add learning mode selector to the UI
    this.addModeSelector();
    
    // Load saved mode
    this.loadMode();
  },
  
  // Add learning mode selector to the UI
  addModeSelector() {
    // Add to the topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const modeSelector = document.createElement('div');
      modeSelector.className = 'learning-mode-selector';
      modeSelector.innerHTML = `
        <select id="learningModeSelect" class="btn" style="background: #1b2130; border: 1px solid #2a3147; color: #d7def0;">
          ${Object.entries(this.modes).map(([id, mode]) => 
            `<option value="${id}" ${id === this.currentMode ? 'selected' : ''}>${mode.name}</option>`
          ).join('')}
        </select>
      `;
      
      // Insert before the settings button
      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn && settingsBtn.parentNode) {
        settingsBtn.parentNode.insertBefore(modeSelector, settingsBtn);
      } else {
        topbar.appendChild(modeSelector);
      }
      
      // Bind change event
      const select = document.getElementById('learningModeSelect');
      if (select) {
        select.addEventListener('change', (e) => {
          this.setMode(e.target.value);
        });
      }
    }
  },
  
  // Load saved mode
  async loadMode() {
    try {
      const savedMode = await localforage.getItem('learningMode');
      if (savedMode && this.modes[savedMode]) {
        this.currentMode = savedMode;
        this.updateModeSelector();
      }
    } catch (error) {
      console.error('Failed to load learning mode:', error);
    }
  },
  
  // Save mode
  async saveMode() {
    try {
      await localforage.setItem('learningMode', this.currentMode);
    } catch (error) {
      console.error('Failed to save learning mode:', error);
    }
  },
  
  // Set learning mode
  setMode(modeId) {
    if (!this.modes[modeId]) return;
    
    this.currentMode = modeId;
    this.saveMode();
    this.updateModeSelector();
    
    // Refresh content if a note is open
    if (UI.state.currentId) {
      UI.renderPreview();
    }
    
    toast(`Learning mode set to ${this.modes[modeId].name}`);
  },
  
  // Update mode selector UI
  updateModeSelector() {
    const select = document.getElementById('learningModeSelect');
    if (select) {
      select.value = this.currentMode;
    }
  },
  
  // Adapt content for learning mode
  adaptContent(content) {
    // This is a simplified implementation
    // In a real application, this would use AI to adapt content complexity
    const mode = this.modes[this.currentMode];
    
    // Add mode indicator to content
    const modeIndicator = `<div class="learning-mode-indicator" style="background: #1b2130; border: 1px solid #2a3147; border-radius: 6px; padding: 8px; margin-bottom: 16px;">
      <strong>Learning Mode: ${mode.name}</strong> - ${mode.description}
    </div>`;
    
    return modeIndicator + content;
  },
  
  // Get explanation for AI terms
  getExplanation(term) {
    const explanations = {
      'neural network': {
        beginner: 'A computer system inspired by the human brain that can learn to recognize patterns',
        intermediate: 'A machine learning model composed of interconnected nodes (neurons) organized in layers that process information',
        advanced: 'A computational model consisting of artificial neurons arranged in layers, with weighted connections that are adjusted during training to minimize prediction error'
      },
      'machine learning': {
        beginner: 'A type of artificial intelligence that allows computers to learn from data without being explicitly programmed',
        intermediate: 'A subset of AI that involves algorithms that can learn patterns from data and make predictions or decisions',
        advanced: 'A field of computer science that develops algorithms capable of automatically improving through experience and data analysis'
      },
      'deep learning': {
        beginner: 'A advanced type of machine learning that uses neural networks with many layers',
        intermediate: 'A subset of machine learning that uses multi-layered neural networks to model complex patterns in data',
        advanced: 'A class of machine learning algorithms that use multiple layers of nonlinear processing units to learn hierarchical representations of data'
      }
    };
    
    const termExplanations = explanations[term.toLowerCase()];
    return termExplanations ? termExplanations[this.currentMode] : null;
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LearningMode.init());
} else {
  LearningMode.init();
}