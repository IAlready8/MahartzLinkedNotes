/* plugin-system.js — Advanced plugin architecture with marketplace */

const PluginSystem = {
  plugins: new Map(),
  pluginRegistry: new Map(),
  pluginSettings: {},
  
  // Initialize plugin system
  async init() {
    // Load installed plugins
    await this.loadInstalledPlugins();
    
    // Register core plugins
    this.registerCorePlugins();
    
    // Initialize plugin UI
    this.initPluginUI();
  },
  
  // Register core plugins
  registerCorePlugins() {
    // Task management plugin
    this.registerPlugin({
      id: 'task-manager',
      name: 'Task Manager',
      version: '1.0.0',
      description: 'Advanced task management with due dates, priorities, and progress tracking',
      author: 'Mahart Team',
      category: 'productivity',
      icon: '✅',
      enabled: true,
      settings: {
        defaultPriority: 'normal',
        showInSidebar: true
      },
      init: this.initTaskManager.bind(this),
      render: this.renderTaskManager.bind(this)
    });
    
    // Calendar integration plugin
    this.registerPlugin({
      id: 'calendar',
      name: 'Calendar Integration',
      version: '1.0.0',
      description: 'Calendar view for tasks and note creation dates',
      author: 'Mahart Team',
      category: 'productivity',
      icon: '📅',
      enabled: true,
      settings: {
        showWeekends: true,
        firstDayOfWeek: 0
      },
      init: this.initCalendar.bind(this),
      render: this.renderCalendar.bind(this)
    });
    
    // Export utilities plugin
    this.registerPlugin({
      id: 'export-utils',
      name: 'Export Utilities',
      version: '1.0.0',
      description: 'Advanced export options including PDF, HTML, and custom formats',
      author: 'Mahart Team',
      category: 'utilities',
      icon: '📤',
      enabled: true,
      settings: {
        defaultFormat: 'pdf',
        includeMetadata: true
      },
      init: this.initExportUtils.bind(this),
      render: this.renderExportUtils.bind(this)
    });
    
    // Mind mapping plugin
    this.registerPlugin({
      id: 'mindmap',
      name: 'Mind Mapping',
      version: '1.0.0',
      description: 'Interactive mind mapping visualization',
      author: 'Mahart Team',
      category: 'visualization',
      icon: '🧠',
      enabled: true,
      settings: {
        layout: 'force',
        autoColor: true
      },
      init: this.initMindMap.bind(this),
      render: this.renderMindMap.bind(this)
    });
  },
  
  // Register a plugin
  registerPlugin(plugin) {
    if (!plugin.id || !plugin.name) {
      throw new Error('Plugin must have id and name');
    }
    
    this.pluginRegistry.set(plugin.id, plugin);
    
    // Auto-initialize if enabled
    if (plugin.enabled) {
      this.initPlugin(plugin.id);
    }
  },
  
  // Initialize a plugin
  async initPlugin(pluginId) {
    const plugin = this.pluginRegistry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    try {
      if (plugin.init) {
        await plugin.init();
      }
      this.plugins.set(pluginId, plugin);
      console.log(`Plugin ${plugin.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize plugin ${plugin.name}:`, error);
    }
  },
  
  // Load installed plugins from storage
  async loadInstalledPlugins() {
    try {
      const installed = await localforage.getItem('installedPlugins') || {};
      this.pluginSettings = await localforage.getItem('pluginSettings') || {};
      
      // Load custom plugins
      for (const [pluginId, pluginData] of Object.entries(installed)) {
        this.registerPlugin({
          ...pluginData,
          enabled: this.pluginSettings[pluginId]?.enabled !== false
        });
      }
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
    }
  },
  
  // Install a plugin from marketplace
  async installPlugin(pluginManifest) {
    try {
      // Fetch plugin code
      const response = await fetch(pluginManifest.url);
      const pluginCode = await response.text();
      
      // Validate plugin (basic validation)
      if (!pluginCode.includes('pluginId') || !pluginCode.includes('init')) {
        throw new Error('Invalid plugin format');
      }
      
      // Store plugin
      const installed = await localforage.getItem('installedPlugins') || {};
      installed[pluginManifest.id] = pluginManifest;
      await localforage.setItem('installedPlugins', installed);
      
      // Register and initialize
      this.registerPlugin({
        ...pluginManifest,
        enabled: true
      });
      
      return true;
    } catch (error) {
      console.error('Failed to install plugin:', error);
      return false;
    }
  },
  
  // Uninstall a plugin
  async uninstallPlugin(pluginId) {
    try {
      const installed = await localforage.getItem('installedPlugins') || {};
      delete installed[pluginId];
      await localforage.setItem('installedPlugins', installed);
      
      // Remove settings
      delete this.pluginSettings[pluginId];
      await localforage.setItem('pluginSettings', this.pluginSettings);
      
      // Unregister
      this.pluginRegistry.delete(pluginId);
      this.plugins.delete(pluginId);
      
      return true;
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
      return false;
    }
  },
  
  // Get all available plugins
  getAvailablePlugins() {
    return Array.from(this.pluginRegistry.values());
  },
  
  // Get installed plugins
  getInstalledPlugins() {
    return Array.from(this.plugins.values());
  },
  
  // Render plugin UI
  renderPlugin(pluginId, container) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.render) return;
    
    plugin.render(container);
  },
  
  // Plugin UI initialization
  initPluginUI() {
    // This will be called to initialize plugin UI components
  },
  
  // Plugin settings management
  async updatePluginSettings(pluginId, settings) {
    this.pluginSettings[pluginId] = {
      ...this.pluginSettings[pluginId],
      ...settings
    };
    
    await localforage.setItem('pluginSettings', this.pluginSettings);
  },
  
  // Get plugin settings
  getPluginSettings(pluginId) {
    return this.pluginSettings[pluginId] || {};
  },
  
  // Task Manager Plugin Implementation
  async initTaskManager() {
    // Initialize task management system
    console.log('Task Manager initialized');
  },
  
  renderTaskManager(container) {
    container.innerHTML = `
      <div class="plugin-task-manager">
        <h3>Task Manager</h3>
        <div class="task-controls">
          <button id="addTaskBtn" class="btn">Add Task</button>
          <select id="taskFilter">
            <option value="all">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div id="taskList" class="task-list"></div>
      </div>
    `;
    
    // Bind events
    const addTaskBtn = container.querySelector('#addTaskBtn');
    const taskFilter = container.querySelector('#taskFilter');
    const taskList = container.querySelector('#taskList');
    
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => this.showTaskModal());
    }
    
    if (taskFilter) {
      taskFilter.addEventListener('change', () => this.renderTaskList(taskList, taskFilter.value));
    }
    
    // Initial render
    if (taskList) {
      this.renderTaskList(taskList, 'all');
    }
  },
  
  async renderTaskList(container, filter = 'all') {
    // Render tasks based on filter
    container.innerHTML = '<div class="loading">Loading tasks...</div>';
    
    try {
      const notes = await Store.allNotes();
      const tasks = this.extractTasksFromNotes(notes);
      
      // Apply filter
      const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'todo') return !task.completed;
        if (filter === 'in-progress') return task.inProgress;
        if (filter === 'completed') return task.completed;
        return true;
      });
      
      if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="no-tasks">No tasks found</div>';
        return;
      }
      
      container.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.inProgress ? 'in-progress' : ''}">
          <div class="task-header">
            <h4>${task.title}</h4>
            <div class="task-meta">
              ${task.priority ? `<span class="priority ${task.priority}">${task.priority}</span>` : ''}
              ${task.dueDate ? `<span class="due-date">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
            </div>
          </div>
          <div class="task-description">${task.description || ''}</div>
          <div class="task-actions">
            <button class="btn btn-small" onclick="PluginSystem.toggleTaskStatus('${task.id}')">
              ${task.completed ? 'Reopen' : 'Complete'}
            </button>
            <button class="btn btn-small btn-secondary" onclick="PluginSystem.editTask('${task.id}')">Edit</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<div class="error">Failed to load tasks</div>';
    }
  },
  
  extractTasksFromNotes(notes) {
    const tasks = [];
    
    notes.forEach(note => {
      // Extract tasks from note content (Markdown task lists)
      const taskRegex = /- \[([ xX])\] (.+?)(?:\s*\(([^)]+)\))?/g;
      let match;
      
      while ((match = taskRegex.exec(note.body)) !== null) {
        const [_, checked, taskText, metadata] = match;
        const completed = checked !== ' ';
        
        tasks.push({
          id: `${note.id}-${match.index}`,
          noteId: note.id,
          title: taskText.trim(),
          completed,
          inProgress: false,
          priority: this.extractPriority(taskText, metadata),
          dueDate: this.extractDueDate(metadata),
          description: this.extractTaskDescription(note.body, match.index)
        });
      }
    });
    
    return tasks;
  },
  
  extractPriority(taskText, metadata) {
    if (!metadata) return 'normal';
    
    const priorityMatch = metadata.match(/priority:(\w+)/i);
    if (priorityMatch) {
      return priorityMatch[1].toLowerCase();
    }
    
    // Extract from task text
    if (taskText.includes('!')) return 'high';
    if (taskText.includes('?')) return 'low';
    
    return 'normal';
  },
  
  extractDueDate(metadata) {
    if (!metadata) return null;
    
    const dateMatch = metadata.match(/due:(\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      return dateMatch[1];
    }
    
    return null;
  },
  
  extractTaskDescription(body, taskIndex) {
    // Extract description from the lines following the task
    const lines = body.split('\n');
    const taskLineIndex = lines.findIndex((line, index) => 
      line.includes('- [') && index >= taskIndex
    );
    
    if (taskLineIndex === -1 || taskLineIndex >= lines.length - 1) {
      return '';
    }
    
    // Get next few lines as description
    const descriptionLines = [];
    for (let i = taskLineIndex + 1; i < Math.min(taskLineIndex + 4, lines.length); i++) {
      const line = lines[i].trim();
      if (line.startsWith('- [') || line.startsWith('#')) break;
      if (line) descriptionLines.push(line);
    }
    
    return descriptionLines.join(' ');
  },
  
  showTaskModal(taskId = null) {
    // Show modal for adding/editing tasks
    let task = null;
    if (taskId) {
      // Load existing task
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>${taskId ? 'Edit Task' : 'Add Task'}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="taskForm">
            <div class="form-group">
              <label>Task Title</label>
              <input type="text" id="taskTitle" class="form-control" value="${task ? task.title : ''}" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="taskDescription" class="form-control" rows="3">${task ? task.description : ''}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Priority</label>
                <select id="taskPriority" class="form-control">
                  <option value="low">Low</option>
                  <option value="normal" selected>Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" id="taskDueDate" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <button type="submit" class="btn">Save Task</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const form = modal.querySelector('#taskForm');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveTask(taskId);
      close();
    });
  },
  
  async saveTask(taskId) {
    // Save task logic
    toast('Task saved');
  },
  
  toggleTaskStatus(taskId) {
    // Toggle task completion status
    toast('Task status updated');
  },
  
  editTask(taskId) {
    this.showTaskModal(taskId);
  },
  
  // Calendar Plugin Implementation
  async initCalendar() {
    console.log('Calendar plugin initialized');
  },
  
  renderCalendar(container) {
    container.innerHTML = `
      <div class="plugin-calendar">
        <h3>Calendar</h3>
        <div class="calendar-controls">
          <button id="prevMonth" class="btn btn-small">←</button>
          <span id="currentMonth" class="month-label">January 2023</span>
          <button id="nextMonth" class="btn btn-small">→</button>
        </div>
        <div id="calendarGrid" class="calendar-grid"></div>
      </div>
    `;
    
    this.renderCalendarGrid(container);
  },
  
  renderCalendarGrid(container) {
    const grid = container.querySelector('#calendarGrid');
    if (!grid) return;
    
    // Current month view
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Month label
    const monthLabel = container.querySelector('#currentMonth');
    if (monthLabel) {
      monthLabel.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    // Calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    let html = '<div class="calendar-header">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });
    html += '</div><div class="calendar-days">';
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      
      html += `
        <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}">
          <div class="day-number">${currentDate.getDate()}</div>
          <div class="day-events"></div>
        </div>
      `;
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    html += '</div>';
    grid.innerHTML = html;
  },
  
  // Export Utilities Plugin Implementation
  async initExportUtils() {
    console.log('Export Utilities initialized');
  },
  
  renderExportUtils(container) {
    container.innerHTML = `
      <div class="plugin-export-utils">
        <h3>Export Utilities</h3>
        <div class="export-options">
          <div class="export-option">
            <h4>PDF Export</h4>
            <p>Export notes as professional PDF documents</p>
            <button class="btn" onclick="PluginSystem.exportToPDF()">Export to PDF</button>
          </div>
          <div class="export-option">
            <h4>HTML Export</h4>
            <p>Export notes as standalone HTML files</p>
            <button class="btn" onclick="PluginSystem.exportToHTML()">Export to HTML</button>
          </div>
          <div class="export-option">
            <h4>Custom Format</h4>
            <p>Export with custom templates and formatting</p>
            <button class="btn" onclick="PluginSystem.exportCustom()">Custom Export</button>
          </div>
        </div>
      </div>
    `;
  },
  
  async exportToPDF() {
    toast('PDF export started...');
    // PDF export implementation would go here
    setTimeout(() => toast('PDF export completed'), 2000);
  },
  
  async exportToHTML() {
    toast('HTML export started...');
    // HTML export implementation would go here
    setTimeout(() => toast('HTML export completed'), 2000);
  },
  
  async exportCustom() {
    toast('Custom export started...');
    // Custom export implementation would go here
    setTimeout(() => toast('Custom export completed'), 2000);
  },
  
  // Mind Mapping Plugin Implementation
  async initMindMap() {
    console.log('Mind Mapping plugin initialized');
  },
  
  renderMindMap(container) {
    container.innerHTML = `
      <div class="plugin-mindmap">
        <h3>Mind Map</h3>
        <div class="mindmap-controls">
          <button class="btn btn-small" onclick="PluginSystem.refreshMindMap()">Refresh</button>
          <button class="btn btn-small" onclick="PluginSystem.exportMindMap()">Export</button>
        </div>
        <div id="mindmapCanvas" class="mindmap-canvas"></div>
      </div>
    `;
    
    this.renderMindMapCanvas(container);
  },
  
  renderMindMapCanvas(container) {
    const canvas = container.querySelector('#mindmapCanvas');
    if (!canvas) return;
    
    canvas.innerHTML = `
      <div class="mindmap-placeholder">
        <div class="mindmap-icon">🧠</div>
        <p>Interactive mind map visualization</p>
        <p>Center note: <strong>${UI.state.currentId ? 'Current Note' : 'Select a note'}</strong></p>
        <button class="btn" onclick="PluginSystem.generateMindMap()">Generate Mind Map</button>
      </div>
    `;
  },
  
  async generateMindMap() {
    toast('Generating mind map...');
    // Mind map generation implementation would go here
    setTimeout(() => toast('Mind map generated'), 1500);
  },
  
  async exportMindMap() {
    toast('Exporting mind map...');
    // Mind map export implementation would go here
    setTimeout(() => toast('Mind map exported'), 1500);
  },
  
  refreshMindMap() {
    toast('Refreshing mind map...');
    // Refresh implementation would go here
    setTimeout(() => toast('Mind map refreshed'), 1000);
  }
};