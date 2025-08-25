/* dynamic-dashboards.js - Dynamic Dashboards for AI Projects */

const DynamicDashboards = {
  // Dashboard templates
  templates: {
    'ai-overview': {
      name: 'AI Project Overview',
      description: 'Comprehensive overview of all AI projects with key metrics',
      widgets: ['project-count', 'tag-cloud', 'recent-activity', 'link-density']
    },
    'research-dashboard': {
      name: 'AI Research Dashboard',
      description: 'Dashboard focused on research projects and publications',
      widgets: ['research-count', 'publication-timeline', 'collaboration-network', 'citation-metrics']
    },
    'product-dashboard': {
      name: 'AI Product Dashboard',
      description: 'Dashboard focused on product development and deployment',
      widgets: ['product-count', 'deployment-status', 'user-engagement', 'performance-metrics']
    }
  },
  
  // Available widgets
  widgets: {
    'project-count': {
      name: 'Project Count',
      description: 'Total number of AI projects',
      render: function(data) {
        return `
          <div class="dashboard-widget project-count">
            <div class="widget-header">
              <h3>AI Projects</h3>
            </div>
            <div class="widget-content">
              <div class="metric-value">${data.count || 0}</div>
              <div class="metric-description">Active Projects</div>
            </div>
          </div>
        `;
      }
    },
    'tag-cloud': {
      name: 'Tag Cloud',
      description: 'Visualization of most used AI-related tags',
      render: function(data) {
        const tags = data.tags || [];
        return `
          <div class="dashboard-widget tag-cloud">
            <div class="widget-header">
              <h3>Popular Tags</h3>
            </div>
            <div class="widget-content">
              <div class="tag-cloud-content">
                ${tags.map(tag => 
                  `<span class="tag ai-tag" style="font-size: ${12 + (tag.count || 1) * 2}px;">${tag.name}</span>`
                ).join('')}
              </div>
            </div>
          </div>
        `;
      }
    },
    'recent-activity': {
      name: 'Recent Activity',
      description: 'Recently updated AI projects',
      render: function(data) {
        const activities = data.activities || [];
        return `
          <div class="dashboard-widget recent-activity">
            <div class="widget-header">
              <h3>Recent Activity</h3>
            </div>
            <div class="widget-content">
              <div class="activity-list">
                ${activities.map(activity => `
                  <div class="activity-item">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }
    },
    'link-density': {
      name: 'Link Density',
      description: 'Average number of links per AI project',
      render: function(data) {
        return `
          <div class="dashboard-widget link-density">
            <div class="widget-header">
              <h3>Link Density</h3>
            </div>
            <div class="widget-content">
              <div class="metric-value">${data.density || 0}</div>
              <div class="metric-description">Links per Project</div>
            </div>
          </div>
        `;
      }
    }
  },
  
  // Initialize dynamic dashboards
  init() {
    // Add dashboard button to the UI
    this.addDashboardButton();
  },
  
  // Add dashboard button to the UI
  addDashboardButton() {
    // Add to the topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const dashboardBtn = document.createElement('button');
      dashboardBtn.id = 'dashboardBtn';
      dashboardBtn.className = 'btn';
      dashboardBtn.textContent = 'Dashboards';
      dashboardBtn.onclick = () => this.showDashboardSelector();
      
      // Insert before the settings button
      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn && settingsBtn.parentNode) {
        settingsBtn.parentNode.insertBefore(dashboardBtn, settingsBtn);
      } else {
        topbar.appendChild(dashboardBtn);
      }
    }
  },
  
  // Show dashboard selector
  showDashboardSelector() {
    // Create modal for dashboard selection
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 600px;">
        <div class="modal-header">
          <h2>Select Dashboard</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Choose a dashboard template:</p>
          <div class="dashboard-templates">
            ${Object.entries(this.templates).map(([id, template]) => `
              <div class="template-option" data-template="${id}">
                <div class="template-name">${template.name}</div>
                <div class="template-description">${template.description}</div>
                <div class="template-widgets">
                  ${template.widgets.map(widgetId => {
                    const widget = this.widgets[widgetId];
                    return widget ? `<span class="widget-tag">${widget.name}</span>` : '';
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="form-actions" style="margin-top: 20px;">
            <button id="cancelDashboard" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const cancelBtn = document.getElementById('cancelDashboard');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    
    // Bind template selection
    const templateOptions = modal.querySelectorAll('.template-option');
    templateOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const template = e.currentTarget.dataset.template;
        this.showDashboard(template);
        close();
      });
    });
  },
  
  // Show dashboard
  async showDashboard(templateId) {
    const template = this.templates[templateId];
    if (!template) {
      toast('Dashboard template not found');
      return;
    }
    
    // Create dashboard modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 90%; max-width: 1200px; height: 90vh;">
        <div class="modal-header">
          <h2>${template.name}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="height: calc(100% - 60px); overflow: auto;">
          <div id="dashboardContainer" style="height: 100%;">
            <div class="loading">Loading dashboard...</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind close event
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    // Load dashboard data
    try {
      const data = await this.loadDashboardData(template);
      this.renderDashboard(template, data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      const container = document.getElementById('dashboardContainer');
      if (container) {
        container.innerHTML = `<div class="error">Failed to load dashboard: ${error.message}</div>`;
      }
    }
  },
  
  // Load dashboard data
  async loadDashboardData(template) {
    // Get all notes
    const notes = await Store.allNotes();
    
    // Filter AI-related notes
    const aiNotes = notes.filter(note => 
      note.tags && note.tags.some(tag => 
        tag.includes('#ai') || tag.includes('#artificial') ||
        tag.includes('#neural') || tag.includes('#machine') ||
        tag.includes('#deep') || tag.includes('#learning') ||
        tag.includes('#generative') || tag.includes('#automation') ||
        tag.includes('#coding') || tag.includes('#development') ||
        tag.includes('#visualization')
      )
    );
    
    // Prepare data for widgets
    const data = {
      'project-count': { count: aiNotes.length },
      'tag-cloud': { tags: this.getPopularTags(aiNotes) },
      'recent-activity': { activities: this.getRecentActivity(aiNotes) },
      'link-density': { density: this.calculateLinkDensity(aiNotes) }
    };
    
    return data;
  },
  
  // Get popular tags
  getPopularTags(notes) {
    const tagCounts = {};
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
  
  // Get recent activity
  getRecentActivity(notes) {
    return notes
      .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
      .slice(0, 5)
      .map(note => ({
        title: note.title,
        time: new Date(note.updatedAt || note.createdAt).toLocaleDateString()
      }));
  },
  
  // Calculate link density
  calculateLinkDensity(notes) {
    if (notes.length === 0) return 0;
    
    const totalLinks = notes.reduce((sum, note) => sum + (note.links || []).length, 0);
    return (totalLinks / notes.length).toFixed(1);
  },
  
  // Render dashboard
  renderDashboard(template, data) {
    const container = document.getElementById('dashboardContainer');
    if (!container) return;
    
    let html = `
      <div class="dashboard-view">
        <div class="dashboard-header">
          <h1>${template.name}</h1>
          <p>${template.description}</p>
        </div>
        <div class="dashboard-grid">
    `;
    
    // Render widgets
    template.widgets.forEach(widgetId => {
      const widget = this.widgets[widgetId];
      if (widget && data[widgetId]) {
        html += widget.render(data[widgetId]);
      }
    });
    
    html += `
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DynamicDashboards.init());
} else {
  DynamicDashboards.init();
}