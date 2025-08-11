/* advanced-ui.js — Advanced UI components and enhancements */

const AdvancedUI = {
  // Initialize advanced UI components
  async init() {
    this.createCommandPalette();
    this.createStatusBar();
    this.createFloatingActions();
    this.enhanceNoteList();
    this.enhanceTagSystem();
  },
  
  // Create command palette (Ctrl/Cmd + P)
  createCommandPalette() {
    // Create palette container
    const palette = document.createElement('div');
    palette.id = 'commandPalette';
    palette.className = 'command-palette';
    palette.innerHTML = `
      <div class="palette-overlay"></div>
      <div class="palette-container">
        <input type="text" id="paletteInput" placeholder="Type a command or search..." autocomplete="off">
        <div class="palette-results" id="paletteResults"></div>
      </div>
    `;
    
    document.body.appendChild(palette);
    
    // Define commands
    const commands = [
      {
        id: 'new-note',
        title: 'New Note',
        category: 'Notes',
        shortcut: 'Ctrl+N',
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.newNote === 'function') {
            UI.newNote();
          }
        }
      },
      {
        id: 'save-note',
        title: 'Save Note',
        category: 'Notes',
        shortcut: 'Ctrl+S',
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.save === 'function') {
            UI.save();
          }
        }
      },
      {
        id: 'search-notes',
        title: 'Search Notes',
        category: 'Navigation',
        shortcut: 'Ctrl+K',
        action: () => {
          const searchInput = document.getElementById('q');
          if (searchInput) {
            searchInput.focus();
          }
        }
      },
      {
        id: 'show-graph',
        title: 'Show Graph',
        category: 'Visualization',
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.showGraph === 'function') {
            UI.showGraph();
          }
        }
      },
      {
        id: 'show-dashboard',
        title: 'Show Analytics Dashboard',
        category: 'Analytics',
        action: () => {
          this.showAnalyticsDashboard();
        }
      },
      {
        id: 'export-data',
        title: 'Export Data',
        category: 'Data',
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.export === 'function') {
            UI.export();
          }
        }
      },
      {
        id: 'import-data',
        title: 'Import Data',
        category: 'Data',
        action: () => {
          const importFile = document.getElementById('importFile');
          if (importFile) {
            importFile.click();
          }
        }
      },
      {
        id: 'show-settings',
        title: 'Settings',
        category: 'Application',
        action: () => {
          const settings = document.getElementById('settings');
          if (settings) {
            settings.showModal();
          }
        }
      },
      {
        id: 'show-templates',
        title: 'New Note from Template',
        category: 'Notes',
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.showTemplateMenu === 'function') {
            UI.showTemplateMenu();
          }
        }
      },
      {
        id: 'show-history',
        title: 'Show Note History',
        category: 'Notes',
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.toggleHistoryPanel === 'function') {
            UI.toggleHistoryPanel();
          }
        }
      }
    ];
    
    // Bind events
    const input = document.getElementById('paletteInput');
    const results = document.getElementById('paletteResults');
    const overlay = palette.querySelector('.palette-overlay');
    
    let selectedindex = -1;
    let filteredCommands = [...commands];
    
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase();
      filteredCommands = query 
        ? commands.filter(cmd => 
            cmd.title.toLowerCase().includes(query) || 
            cmd.category.toLowerCase().includes(query)
          )
        : [...commands];
      
      selectedindex = -1;
      this.renderPaletteResults(filteredCommands, selectedindex);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideCommandPalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedindex = Math.min(selectedindex + 1, filteredCommands.length - 1);
        this.renderPaletteResults(filteredCommands, selectedindex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedindex = Math.max(selectedindex - 1, -1);
        this.renderPaletteResults(filteredCommands, selectedindex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedindex >= 0 && selectedindex < filteredCommands.length) {
          filteredCommands[selectedindex].action();
          this.hideCommandPalette();
        } else if (filteredCommands.length > 0) {
          filteredCommands[0].action();
          this.hideCommandPalette();
        }
      }
    });
    
    overlay.addEventListener('click', () => {
      this.hideCommandPalette();
    });
    
    // Bind global shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        this.showCommandPalette();
      }
    });
  },
  
  renderPaletteResults(commands, selectedIndex) {
    const results = document.getElementById('paletteResults');
    if (!results) return;
    
    if (commands.length === 0) {
      results.innerHTML = '<div class="palette-empty">No commands found</div>';
      return;
    }
    
    // Group by category
    const categories = {};
    commands.forEach((cmd, index) => {
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      categories[cmd.category].push({ ...cmd, index });
    });
    
    results.innerHTML = Object.entries(categories).map(([category, cmds]) => `
      <div class="palette-category">
        <div class="category-title">${category}</div>
        ${cmds.map(cmd => `
          <div class="palette-item ${cmd.index === selectedIndex ? 'selected' : ''}" 
               data-index="${cmd.index}">
            <div class="item-title">${cmd.title}</div>
            ${cmd.shortcut ? `<div class="item-shortcut">${cmd.shortcut}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
    
    // Bind click events
    results.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        if (index >= 0 && index < commands.length) {
          commands[index].action();
          this.hideCommandPalette();
        }
      });
    });
  },
  
  showCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (!palette) return;
    
    palette.style.display = 'block';
    setTimeout(() => {
      palette.classList.add('visible');
      const input = document.getElementById('paletteInput');
      if (input) {
        input.value = '';
        input.focus();
        // Trigger input event to show all commands
        input.dispatchEvent(new Event('input'));
      }
    }, 10);
  },
  
  hideCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (!palette) return;
    
    palette.classList.remove('visible');
    setTimeout(() => {
      palette.style.display = 'none';
    }, 200);
  },
  
  // Create status bar
  createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.id = 'statusBar';
    statusBar.className = 'status-bar';
    
    statusBar.innerHTML = `
      <div class="status-section">
        <span id="noteCountStatus">0 notes</span>
      </div>
      <div class="status-section">
        <span id="linkCountStatus">0 links</span>
      </div>
      <div class="status-section">
        <span id="collabStatus">Offline</span>
      </div>
      <div class="status-section">
        <span id="aiStatus">AI Assistant Ready</span>
      </div>
    `;
    
    // Insert before closing body tag
    document.body.appendChild(statusBar);
    
    // Update status periodically
    this.updateStatusBar();
    setInterval(() => this.updateStatusBar(), 5000);
  },
  
  async updateStatusBar() {
    const noteCountStatus = document.getElementById('noteCountStatus');
    const linkCountStatus = document.getElementById('linkCountStatus');
    const collabStatus = document.getElementById('collabStatus');
    const aiStatus = document.getElementById('aiStatus');
    
    if (noteCountStatus || linkCountStatus) {
      try {
        const notes = await Store.allNotes();
        const totalLinks = notes.reduce((sum, note) => sum + (note.links || []).length, 0);
        
        if (noteCountStatus) {
          noteCountStatus.textContent = `${notes.length} notes`;
        }
        
        if (linkCountStatus) {
          linkCountStatus.textContent = `${totalLinks} links`;
        }
      } catch (e) {
        console.error('Failed to update status bar:', e);
      }
    }
    
    if (collabStatus) {
      if (typeof Collaboration !== 'undefined') {
        const peerCount = Collaboration.getPeerCount();
        collabStatus.textContent = peerCount > 0 
          ? `${peerCount} user${peerCount > 1 ? 's' : ''} online` 
          : 'Offline';
      }
    }
    
    if (aiStatus) {
      aiStatus.textContent = 'AI Assistant Ready';
    }
  },
  
  // Create floating action buttons
  createFloatingActions() {
    const fabContainer = document.createElement('div');
    fabContainer.id = 'fabContainer';
    fabContainer.className = 'fab-container';
    
    fabContainer.innerHTML = `
      <button id="fabMain" class="fab-main">
        <span>+</span>
      </button>
      <div class="fab-actions">
        <button id="fabNewNote" class="fab-action" title="New Note">
          <span>📝</span>
        </button>
        <button id="fabNewTemplate" class="fab-action" title="From Template">
          <span>📋</span>
        </button>
        <button id="fabGraph" class="fab-action" title="Show Graph">
          <span>🕸️</span>
        </button>
        <button id="fabDashboard" class="fab-action" title="Analytics">
          <span>📊</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(fabContainer);
    
    // Bind events
    const fabMain = document.getElementById('fabMain');
    const fabActions = fabContainer.querySelector('.fab-actions');
    
    let isOpen = false;
    
    fabMain.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        fabMain.classList.add('open');
        fabActions.classList.add('visible');
      } else {
        fabMain.classList.remove('open');
        fabActions.classList.remove('visible');
      }
    });
    
    // Bind action buttons
    const fabNewNote = document.getElementById('fabNewNote');
    const fabNewTemplate = document.getElementById('fabNewTemplate');
    const fabGraph = document.getElementById('fabGraph');
    const fabDashboard = document.getElementById('fabDashboard');
    
    if (fabNewNote) {
      fabNewNote.addEventListener('click', () => {
        if (typeof UI !== 'undefined' && typeof UI.newNote === 'function') {
          UI.newNote();
          isOpen = false;
          fabMain.classList.remove('open');
          fabActions.classList.remove('visible');
        }
      });
    }
    
    if (fabNewTemplate) {
      fabNewTemplate.addEventListener('click', () => {
        if (typeof UI !== 'undefined' && typeof UI.showTemplateMenu === 'function') {
          UI.showTemplateMenu();
          isOpen = false;
          fabMain.classList.remove('open');
          fabActions.classList.remove('visible');
        }
      });
    }
    
    if (fabGraph) {
      fabGraph.addEventListener('click', () => {
        if (typeof UI !== 'undefined' && typeof UI.showGraph === 'function') {
          UI.showGraph();
          isOpen = false;
          fabMain.classList.remove('open');
          fabActions.classList.remove('visible');
        }
      });
    }
    
    if (fabDashboard) {
      fabDashboard.addEventListener('click', () => {
        this.showAnalyticsDashboard();
        isOpen = false;
        fabMain.classList.remove('open');
        fabActions.classList.remove('visible');
      });
    }
    
    // Close FAB when clicking outside
    document.addEventListener('click', (e) => {
      if (!fabContainer.contains(e.target) && isOpen) {
        isOpen = false;
        fabMain.classList.remove('open');
        fabActions.classList.remove('visible');
      }
    });
  },
  
  // Enhance note list with additional features
  enhanceNoteList() {
    // This will be called after the note list is rendered
    // We'll add features like drag and drop, quick actions, etc.
  },
  
  // Enhance tag system with advanced features
  enhanceTagSystem() {
    // This will enhance the existing tag system with features like:
    // - Tag hierarchy
    // - Tag color customization
    // - Tag merging
    // - Tag analytics
  },
  
  // Show analytics dashboard
  async showAnalyticsDashboard() {
    // Create or show analytics dashboard modal
    let dashboardModal = document.getElementById('analyticsDashboard');
    
    if (!dashboardModal) {
      dashboardModal = document.createElement('div');
      dashboardModal.id = 'analyticsDashboard';
      dashboardModal.className = 'modal';
      dashboardModal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="width: 90%; max-width: 1200px; height: 90vh;">
          <div class="modal-header">
            <h2>Knowledge Graph Analytics</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body" style="height: calc(100% - 60px); overflow: auto;">
            <div id="dashboardContainer" style="height: 100%;">
              <div class="loading">Loading analytics...</div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(dashboardModal);
      
      // Bind close event
      const closeBtn = dashboardModal.querySelector('.modal-close');
      const overlay = dashboardModal.querySelector('.modal-overlay');
      
      const closeDashboard = () => {
        dashboardModal.style.display = 'none';
      };
      
      closeBtn.addEventListener('click', closeDashboard);
      overlay.addEventListener('click', closeDashboard);
    }
    
    // Show modal
    dashboardModal.style.display = 'block';
    
    // Load analytics
    try {
      const notes = await Store.allNotes();
      const container = document.getElementById('dashboardContainer');
      
      if (typeof AdvancedViz !== 'undefined' && typeof AdvancedViz.renderDashboard === 'function') {
        AdvancedViz.renderDashboard(container, notes);
      } else {
        container.innerHTML = '<div class="error">Analytics module not available</div>';
      }
    } catch (e) {
      console.error('Failed to load analytics dashboard:', e);
      const container = document.getElementById('dashboardContainer');
      if (container) {
        container.innerHTML = '<div class="error">Failed to load analytics</div>';
      }
    }
  },
  
  // Show AI assistant panel
  showAIAssistant() {
    // Create or show AI assistant panel
    let assistantPanel = document.getElementById('aiAssistantPanel');
    
    if (!assistantPanel) {
      assistantPanel = document.createElement('div');
      assistantPanel.id = 'aiAssistantPanel';
      assistantPanel.className = 'sidebar-panel';
      assistantPanel.innerHTML = `
        <div class="panel-header">
          <h3>AI Assistant</h3>
          <button class="panel-close">&times;</button>
        </div>
        <div class="panel-content">
          <div class="ai-chat">
            <div class="ai-messages" id="aiMessages"></div>
            <div class="ai-input">
              <input type="text" id="aiInput" placeholder="Ask me anything about your notes...">
              <button id="aiSend">Send</button>
            </div>
          </div>
        </div>
      `;
      
      // Insert as first child of right panel
      const rightPanel = document.querySelector('.right');
      if (rightPanel) {
        rightPanel.insertBefore(assistantPanel, rightPanel.firstChild);
      }
      
      // Bind events
      const closeBtn = assistantPanel.querySelector('.panel-close');
      closeBtn.addEventListener('click', () => {
        assistantPanel.style.display = 'none';
      });
      
      const input = document.getElementById('aiInput');
      const sendBtn = document.getElementById('aiSend');
      
      const sendMessage = async () => {
        const question = input.value.trim();
        if (!question) return;
        
        // Add user message
        this.addAIMessage('user', question);
        input.value = '';
        
        // Show thinking indicator
        const thinkingId = this.addAIMessage('assistant', 'Thinking...');
        
        try {
          // Get answer from AI assistant
          const notes = await Store.allNotes();
          const answer = await AIAssistant.answerQuestion(question, notes);
          
          // Update thinking message with answer
          const thinkingElement = document.getElementById(thinkingId);
          if (thinkingElement) {
            thinkingElement.querySelector('.message-content').textContent = answer;
            thinkingElement.classList.remove('thinking');
          }
        } catch (e) {
          console.error('AI assistant error:', e);
          const thinkingElement = document.getElementById(thinkingId);
          if (thinkingElement) {
            thinkingElement.querySelector('.message-content').textContent = 'Sorry, I encountered an error.';
            thinkingElement.classList.remove('thinking');
          }
        }
      };
      
      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
    
    // Show panel
    assistantPanel.style.display = 'block';
    
    // Add welcome message
    this.addAIMessage('assistant', 'Hello! I\'m your AI knowledge assistant. Ask me anything about your notes or get productivity tips.');
  },
  
  addAIMessage(role, content) {
    const messagesContainer = document.getElementById('aiMessages');
    if (!messagesContainer) return;
    
    const messageId = 'msg_' + Date.now();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${role} ${role === 'assistant' && content === 'Thinking...' ? 'thinking' : ''}`;
    messageElement.id = messageId;
    messageElement.innerHTML = `
      <div class="message-content">${content}</div>
      <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
  }
};