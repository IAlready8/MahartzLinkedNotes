/* workspace.js — Advanced workspace and team collaboration features */

const Workspace = {
  // Workspaces
  workspaces: new Map(),
  
  // Current workspace
  currentWorkspace: null,
  
  // Team members
  teamMembers: new Map(),
  
  // Permissions system
  permissions: {
    roles: {
      owner: {
        name: 'Owner',
        permissions: ['read', 'write', 'admin', 'delete']
      },
      admin: {
        name: 'Admin',
        permissions: ['read', 'write', 'admin']
      },
      editor: {
        name: 'Editor',
        permissions: ['read', 'write']
      },
      viewer: {
        name: 'Viewer',
        permissions: ['read']
      }
    }
  },
  
  // Initialize workspace system
  async init() {
    // Load workspaces
    await this.loadWorkspaces();
    
    // Load team members
    await this.loadTeamMembers();
    
    // Initialize UI
    this.initUI();
  },
  
  // Load workspaces from storage
  async loadWorkspaces() {
    try {
      const savedWorkspaces = await localforage.getItem('workspaces') || {};
      Object.entries(savedWorkspaces).forEach(([id, workspace]) => {
        this.workspaces.set(id, workspace);
      });
      
      // Set current workspace
      const currentId = await localforage.getItem('currentWorkspace');
      if (currentId && this.workspaces.has(currentId)) {
        this.currentWorkspace = this.workspaces.get(currentId);
      } else if (this.workspaces.size > 0) {
        // Set first workspace as current
        this.currentWorkspace = Array.from(this.workspaces.values())[0];
        await this.saveCurrentWorkspace();
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  },
  
  // Save workspaces to storage
  async saveWorkspaces() {
    try {
      const workspacesObj = {};
      this.workspaces.forEach((workspace, id) => {
        workspacesObj[id] = workspace;
      });
      await localforage.setItem('workspaces', workspacesObj);
    } catch (error) {
      console.error('Failed to save workspaces:', error);
    }
  },
  
  // Save current workspace
  async saveCurrentWorkspace() {
    if (this.currentWorkspace) {
      await localforage.setItem('currentWorkspace', this.currentWorkspace.id);
    }
  },
  
  // Load team members from storage
  async loadTeamMembers() {
    try {
      const savedMembers = await localforage.getItem('teamMembers') || {};
      Object.entries(savedMembers).forEach(([id, member]) => {
        this.teamMembers.set(id, member);
      });
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  },
  
  // Save team members to storage
  async saveTeamMembers() {
    try {
      const membersObj = {};
      this.teamMembers.forEach((member, id) => {
        membersObj[id] = member;
      });
      await localforage.setItem('teamMembers', membersObj);
    } catch (error) {
      console.error('Failed to save team members:', error);
    }
  },
  
  // Initialize UI components
  initUI() {
    // Add workspace selector to UI
    this.addWorkspaceSelector();
  },
  
  // Add workspace selector to UI
  addWorkspaceSelector() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    
    // Create workspace selector
    const workspaceSelector = document.createElement('div');
    workspaceSelector.className = 'workspace-selector';
    workspaceSelector.innerHTML = `
      <button id="workspaceBtn" class="btn workspace-btn">
        <span id="workspaceName">${this.currentWorkspace ? this.currentWorkspace.name : 'Select Workspace'}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
    `;
    
    // Insert after new note button
    const newNoteBtn = document.getElementById('newNote');
    if (newNoteBtn && newNoteBtn.parentNode) {
      newNoteBtn.parentNode.insertBefore(workspaceSelector, newNoteBtn.nextSibling);
    } else {
      topbar.insertBefore(workspaceSelector, topbar.firstChild);
    }
    
    // Bind events
    const workspaceBtn = document.getElementById('workspaceBtn');
    if (workspaceBtn) {
      workspaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showWorkspaceMenu();
      });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('workspaceMenu');
      if (menu && !menu.contains(e.target) && !workspaceBtn.contains(e.target)) {
        menu.remove();
      }
    });
  },
  
  // Show workspace menu
  showWorkspaceMenu() {
    // Remove existing menu
    const existingMenu = document.getElementById('workspaceMenu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'workspaceMenu';
    menu.className = 'dropdown-menu';
    
    // Position menu below button
    const workspaceBtn = document.getElementById('workspaceBtn');
    const rect = workspaceBtn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + window.scrollY) + 'px';
    menu.style.left = (rect.left + window.scrollX) + 'px';
    menu.style.minWidth = rect.width + 'px';
    menu.style.zIndex = '1000';
    
    // Menu content
    let menuContent = `
      <div class="menu-header">
        <h4>Workspaces</h4>
        <button id="newWorkspaceBtn" class="btn btn-small">New Workspace</button>
      </div>
      <div class="menu-items">
    `;
    
    // Add workspaces
    if (this.workspaces.size === 0) {
      menuContent += '<div class="menu-item disabled">No workspaces</div>';
    } else {
      this.workspaces.forEach((workspace, id) => {
        const isActive = this.currentWorkspace && this.currentWorkspace.id === id;
        menuContent += `
          <div class="menu-item ${isActive ? 'active' : ''}" data-workspace-id="${id}">
            ${workspace.name}
            ${isActive ? '<span class="checkmark">✓</span>' : ''}
          </div>
        `;
      });
    }
    
    menuContent += `
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" id="workspaceSettingsBtn">
        Workspace Settings
      </div>
    `;
    
    menu.innerHTML = menuContent;
    document.body.appendChild(menu);
    
    // Bind events
    menu.querySelectorAll('.menu-item[data-workspace-id]').forEach(item => {
      item.addEventListener('click', () => {
        const workspaceId = item.dataset.workspaceId;
        this.switchWorkspace(workspaceId);
        menu.remove();
      });
    });
    
    const newWorkspaceBtn = document.getElementById('newWorkspaceBtn');
    if (newWorkspaceBtn) {
      newWorkspaceBtn.addEventListener('click', () => {
        this.showNewWorkspaceModal();
        menu.remove();
      });
    }
    
    const settingsBtn = document.getElementById('workspaceSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showWorkspaceSettings();
        menu.remove();
      });
    }
  },
  
  // Switch to workspace
  async switchWorkspace(workspaceId) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return;
    
    this.currentWorkspace = workspace;
    await this.saveCurrentWorkspace();
    
    // Update UI
    const workspaceName = document.getElementById('workspaceName');
    if (workspaceName) {
      workspaceName.textContent = workspace.name;
    }
    
    // Refresh app
    if (typeof UI !== 'undefined' && typeof UI.refresh === 'function') {
      await UI.refresh();
    }
    
    toast(`Switched to workspace: ${workspace.name}`);
  },
  
  // Show new workspace modal
  showNewWorkspaceModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>New Workspace</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="newWorkspaceForm">
            <div class="form-group">
              <label>Workspace Name</label>
              <input type="text" id="workspaceNameInput" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="workspaceDescription" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Visibility</label>
              <select id="workspaceVisibility" class="form-control">
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn">Create Workspace</button>
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
    const form = document.getElementById('newWorkspaceForm');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createWorkspace();
      close();
    });
  },
  
  // Create new workspace
  async createWorkspace() {
    const nameInput = document.getElementById('workspaceNameInput');
    const descriptionInput = document.getElementById('workspaceDescription');
    const visibilitySelect = document.getElementById('workspaceVisibility');
    
    if (!nameInput || !nameInput.value.trim()) {
      toast('Please enter a workspace name');
      return;
    }
    
    const workspace = {
      id: ULID(),
      name: nameInput.value.trim(),
      description: descriptionInput ? descriptionInput.value : '',
      visibility: visibilitySelect ? visibilitySelect.value : 'private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: Monetization.user.id,
      members: [{
        userId: Monetization.user.id,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      settings: {
        allowComments: true,
        allowExports: true,
        allowSharing: false
      }
    };
    
    this.workspaces.set(workspace.id, workspace);
    await this.saveWorkspaces();
    
    // Switch to new workspace
    await this.switchWorkspace(workspace.id);
    
    toast('Workspace created successfully');
  },
  
  // Show workspace settings
  showWorkspaceSettings() {
    if (!this.currentWorkspace) {
      toast('No workspace selected');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 600px;">
        <div class="modal-header">
          <h2>Workspace Settings</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="settings-section">
            <h3>General</h3>
            <div class="form-group">
              <label>Workspace Name</label>
              <input type="text" id="workspaceNameSetting" class="form-control" 
                     value="${this.currentWorkspace.name}">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="workspaceDescriptionSetting" class="form-control" rows="3">${this.currentWorkspace.description || ''}</textarea>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Members</h3>
            <div class="team-members">
              ${this.renderTeamMembers()}
            </div>
            <button id="inviteMemberBtn" class="btn btn-small">Invite Member</button>
          </div>
          
          <div class="settings-section">
            <h3>Permissions</h3>
            <div class="form-group">
              <label>Default Role for New Members</label>
              <select id="defaultRole" class="form-control">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div class="settings-actions">
            <button id="saveWorkspaceSettings" class="btn">Save Changes</button>
            <button id="deleteWorkspace" class="btn btn-danger">Delete Workspace</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const saveBtn = document.getElementById('saveWorkspaceSettings');
    const deleteBtn = document.getElementById('deleteWorkspace');
    const inviteBtn = document.getElementById('inviteMemberBtn');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    saveBtn.addEventListener('click', () => this.saveWorkspaceSettings());
    deleteBtn.addEventListener('click', () => this.deleteWorkspace());
    inviteBtn.addEventListener('click', () => this.showInviteModal());
  },
  
  // Render team members
  renderTeamMembers() {
    if (!this.currentWorkspace || !this.currentWorkspace.members) {
      return '<div class="no-members">No members</div>';
    }
    
    return this.currentWorkspace.members.map(member => {
      const user = this.teamMembers.get(member.userId) || { name: 'Unknown User', email: '' };
      const isOwner = member.role === 'owner';
      
      return `
        <div class="team-member">
          <div class="member-info">
            <div class="member-name">${user.name || user.email || member.userId}</div>
            <div class="member-role">${this.permissions.roles[member.role]?.name || member.role}</div>
          </div>
          <div class="member-actions">
            ${!isOwner ? `
              <select class="role-select" data-user-id="${member.userId}">
                <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                <option value="editor" ${member.role === 'editor' ? 'selected' : ''}>Editor</option>
                <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
              <button class="btn btn-small btn-danger remove-member" data-user-id="${member.userId}">Remove</button>
            ` : `
              <span class="owner-tag">Owner</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  },
  
  // Save workspace settings
  async saveWorkspaceSettings() {
    if (!this.currentWorkspace) return;
    
    const nameInput = document.getElementById('workspaceNameSetting');
    const descriptionInput = document.getElementById('workspaceDescriptionSetting');
    const defaultRoleSelect = document.getElementById('defaultRole');
    
    if (nameInput) {
      this.currentWorkspace.name = nameInput.value.trim() || this.currentWorkspace.name;
    }
    
    if (descriptionInput) {
      this.currentWorkspace.description = descriptionInput.value;
    }
    
    if (defaultRoleSelect) {
      this.currentWorkspace.settings.defaultRole = defaultRoleSelect.value;
    }
    
    // Update member roles
    document.querySelectorAll('.role-select').forEach(select => {
      const userId = select.dataset.userId;
      const role = select.value;
      
      const member = this.currentWorkspace.members.find(m => m.userId === userId);
      if (member) {
        member.role = role;
      }
    });
    
    this.currentWorkspace.updatedAt = new Date().toISOString();
    this.workspaces.set(this.currentWorkspace.id, this.currentWorkspace);
    await this.saveWorkspaces();
    
    // Update UI
    const workspaceName = document.getElementById('workspaceName');
    if (workspaceName) {
      workspaceName.textContent = this.currentWorkspace.name;
    }
    
    toast('Workspace settings saved');
  },
  
  // Delete workspace
  async deleteWorkspace() {
    if (!this.currentWorkspace) return;
    
    if (!confirm('Are you sure you want to delete this workspace? This cannot be undone.')) {
      return;
    }
    
    // Check if user is owner
    const currentUserMember = this.currentWorkspace.members.find(
      m => m.userId === Monetization.user.id
    );
    
    if (!currentUserMember || currentUserMember.role !== 'owner') {
      toast('Only workspace owners can delete workspaces');
      return;
    }
    
    this.workspaces.delete(this.currentWorkspace.id);
    await this.saveWorkspaces();
    
    // Switch to another workspace or create default
    if (this.workspaces.size > 0) {
      const nextWorkspace = Array.from(this.workspaces.values())[0];
      await this.switchWorkspace(nextWorkspace.id);
    } else {
      this.currentWorkspace = null;
      await this.saveCurrentWorkspace();
      
      // Update UI
      const workspaceName = document.getElementById('workspaceName');
      if (workspaceName) {
        workspaceName.textContent = 'Select Workspace';
      }
    }
    
    // Close modal
    const modal = document.querySelector('.modal');
    if (modal) {
      document.body.removeChild(modal);
    }
    
    toast('Workspace deleted');
  },
  
  // Show invite modal
  showInviteModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>Invite Team Member</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="inviteForm">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="inviteEmail" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Role</label>
              <select id="inviteRole" class="form-control">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn">Send Invitation</button>
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
    const form = document.getElementById('inviteForm');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.sendInvitation();
      close();
    });
  },
  
  // Send invitation
  async sendInvitation() {
    if (!this.currentWorkspace) return;
    
    const emailInput = document.getElementById('inviteEmail');
    const roleSelect = document.getElementById('inviteRole');
    
    if (!emailInput || !emailInput.value.trim()) {
      toast('Please enter an email address');
      return;
    }
    
    const email = emailInput.value.trim();
    const role = roleSelect ? roleSelect.value : 'viewer';
    
    // In a real implementation, this would send an email invitation
    // For demo, we'll simulate adding a member
    
    const member = {
      userId: `temp_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      role: role,
      joinedAt: new Date().toISOString(),
      invitedBy: Monetization.user.id,
      invitedAt: new Date().toISOString(),
      status: 'invited'
    };
    
    // Add to workspace
    if (!this.currentWorkspace.members) {
      this.currentWorkspace.members = [];
    }
    this.currentWorkspace.members.push(member);
    
    // Save member info
    this.teamMembers.set(member.userId, {
      id: member.userId,
      email: email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    });
    
    await this.saveTeamMembers();
    this.workspaces.set(this.currentWorkspace.id, this.currentWorkspace);
    await this.saveWorkspaces();
    
    toast(`Invitation sent to ${email}`);
  },
  
  // Check permission for action
  checkPermission(action, userId = Monetization.user.id) {
    if (!this.currentWorkspace) return false;
    
    // Owner has all permissions
    if (this.currentWorkspace.ownerId === userId) return true;
    
    // Find user's role in workspace
    const member = this.currentWorkspace.members.find(m => m.userId === userId);
    if (!member) return false;
    
    const role = this.permissions.roles[member.role];
    if (!role) return false;
    
    return role.permissions.includes(action);
  },
  
  // Get user role in current workspace
  getUserRole(userId = Monetization.user.id) {
    if (!this.currentWorkspace) return null;
    
    // Owner check
    if (this.currentWorkspace.ownerId === userId) return 'owner';
    
    // Member check
    const member = this.currentWorkspace.members.find(m => m.userId === userId);
    return member ? member.role : null;
  },
  
  // Filter notes by workspace
  async getWorkspaceNotes() {
    if (!this.currentWorkspace) {
      return [];
    }
    
    const allNotes = await Store.allNotes();
    
    // In a real implementation, notes would be tagged with workspace IDs
    // For demo, we'll return all notes
    return allNotes;
  },
  
  // Add note to workspace
  async addNoteToWorkspace(noteId) {
    if (!this.currentWorkspace) return;
    
    // In a real implementation, this would tag the note with the workspace ID
    // For demo, we'll just log the action
    console.log(`Added note ${noteId} to workspace ${this.currentWorkspace.id}`);
  },
  
  // Remove note from workspace
  async removeNoteFromWorkspace(noteId) {
    if (!this.currentWorkspace) return;
    
    // In a real implementation, this would remove the workspace tag from the note
    // For demo, we'll just log the action
    console.log(`Removed note ${noteId} from workspace ${this.currentWorkspace.id}`);
  },
  
  // Share note with team
  async shareNoteWithTeam(noteId, message = '') {
    if (!this.checkPermission('write')) {
      toast('You do not have permission to share notes');
      return;
    }
    
    // In a real implementation, this would send a notification to team members
    // For demo, we'll just log the action
    console.log(`Shared note ${noteId} with team: ${message}`);
    toast('Note shared with team');
  },
  
  // Get workspace analytics
  async getWorkspaceAnalytics() {
    if (!this.currentWorkspace) {
      return {};
    }
    
    const notes = await this.getWorkspaceNotes();
    
    return {
      totalNotes: notes.length,
      totalMembers: this.currentWorkspace.members.length,
      createdAt: this.currentWorkspace.createdAt,
      updatedAt: this.currentWorkspace.updatedAt,
      mostActiveMembers: this.getMostActiveMembers(notes),
      popularTags: this.getPopularTags(notes),
      noteCreationTrend: this.getNoteCreationTrend(notes)
    };
  },
  
  // Get most active members
  getMostActiveMembers(notes) {
    const memberActivity = {};
    
    notes.forEach(note => {
      // Count note creation and updates
      const creator = note.creatorId || 'unknown';
      memberActivity[creator] = (memberActivity[creator] || 0) + 1;
      
      // Count updates
      if (note.updatedAt !== note.createdAt) {
        const updater = note.lastUpdaterId || 'unknown';
        memberActivity[updater] = (memberActivity[updater] || 0) + 1;
      }
    });
    
    return Object.entries(memberActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({
        userId,
        count,
        user: this.teamMembers.get(userId) || { name: userId }
      }));
  },
  
  // Get popular tags
  getPopularTags(notes) {
    const tagCounts = {};
    
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  },
  
  // Get note creation trend
  getNoteCreationTrend(notes) {
    // Group notes by creation date (weekly)
    const weeklyCounts = {};
    
    notes.forEach(note => {
      const date = new Date(note.createdAt);
      // Get week number
      const week = this.getWeekNumber(date);
      const year = date.getFullYear();
      const key = `${year}-W${week}`;
      
      weeklyCounts[key] = (weeklyCounts[key] || 0) + 1;
    });
    
    return Object.entries(weeklyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 weeks
      .map(([week, count]) => ({ week, count }));
  },
  
  // Get week number for a date
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },
  
  // Show workspace analytics
  async showWorkspaceAnalytics() {
    if (!this.currentWorkspace) {
      toast('No workspace selected');
      return;
    }
    
    const analytics = await this.getWorkspaceAnalytics();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 800px; height: 80vh;">
        <div class="modal-header">
          <h2>Workspace Analytics</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="overflow: auto;">
          <div class="analytics-dashboard">
            <div class="analytics-header">
              <h3>${this.currentWorkspace.name}</h3>
              <div class="workspace-stats">
                <div class="stat-card">
                  <div class="stat-value">${analytics.totalNotes}</div>
                  <div class="stat-label">Notes</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${analytics.totalMembers}</div>
                  <div class="stat-label">Members</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${Object.keys(analytics.popularTags || {}).length}</div>
                  <div class="stat-label">Tags</div>
                </div>
              </div>
            </div>
            
            <div class="analytics-sections">
              <div class="analytics-section">
                <h4>Most Active Members</h4>
                <div class="member-activity">
                  ${(analytics.mostActiveMembers || []).map(member => `
                    <div class="activity-item">
                      <div class="member-name">${member.user.name || member.user.email || member.userId}</div>
                      <div class="activity-count">${member.count} contributions</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="analytics-section">
                <h4>Popular Tags</h4>
                <div class="tag-cloud">
                  ${(analytics.popularTags || []).map(tag => `
                    <span class="tag" style="font-size: ${Math.max(12, tag.count * 2)}px;">${tag.tag} (${tag.count})</span>
                  `).join('')}
                </div>
              </div>
              
              <div class="analytics-section">
                <h4>Note Creation Trend</h4>
                <div class="trend-chart">
                  <!-- Chart would be rendered here -->
                  <div class="chart-placeholder">
                    ${(analytics.noteCreationTrend || []).map(point => `
                      <div class="chart-bar">
                        <div class="bar" style="height: ${(point.count / Math.max(...(analytics.noteCreationTrend || []).map(p => p.count))) * 100}%"></div>
                        <div class="bar-label">${point.week}</div>
                        <div class="bar-value">${point.count}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
  }
};