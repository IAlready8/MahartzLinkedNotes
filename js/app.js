/* app.js — MODULARIZED FOR ROUTER */

// 👑 Guide: The UI object is now structured around pages. 
// Each page has its own init function to load resources on demand.
const UI = {
  state: { currentId: null, autoLink: true, analytics: true, bc: true },
  bc: null,

  // ✅ Fixed: The main init is now lean. It sets up the router and global handlers.
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

  // 🗺️ Plan: Define all pages and their onLoad handlers for the router.
  setupRouter() {
    definePage('#/', {
      pageId: 'page-home',
      onLoad: this.initHomePage.bind(this)
    });
    definePage('#/graph', {
      pageId: 'page-graph',
      onLoad: this.initGraphPage.bind(this)
    });
    definePage('#/tags', {
      pageId: 'page-tags',
      onLoad: this.initTagsPage.bind(this)
    });
    definePage('#/ai', {
      pageId: 'page-ai',
      onLoad: this.initAiPage.bind(this)
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

  // --- EVENT BINDING ---

  bindGlobalHandlers() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { 
        e.preventDefault(); 
        if(window.location.hash === '#/' || window.location.hash === ''){
            this.save(); 
        }
      }
    });
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

  // --- CORE LOGIC ---

  async refreshCurrentPage() {
      const path = window.location.hash || '#/';
      console.log(`Refreshing page: ${path}`);
      if (path === '#/' || path === '') await this.refreshHomePage();
      if (path === '#/tags') await this.renderTagManager();
      if (path === '#/graph') await this.renderGraph();
  },

  async refreshHomePage() {
    const notes = await Store.allNotes();
    this.renderNoteList(notes);
  },

  async openNote(id, alreadyOnPage = false) {
    const n = await Store.get(id);
    if (!n) {
        console.error(`Note with id ${id} not found.`);
        localStorage.removeItem('lastOpenNoteId');
        return;
    }

    this.state.currentId = n.id;
    localStorage.setItem('lastOpenNoteId', n.id);
    
    if (!alreadyOnPage && window.location.hash !== '#/') {
        window.location.hash = '#/';
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const titleEl = el('#title');
    const editorEl = el('#editor');
    const colorButton = el('#noteColorButton');
    
    if(titleEl) titleEl.value = n.title || '';
    if(editorEl) editorEl.value = n.body || '';
    if(colorButton) colorButton.style.backgroundColor = n.color || '#6B7280';
    
    const dirty = el('#dirty');
    if(dirty) dirty.classList.add('hidden');
    this.renderPreviewLive();
    this.renderNoteList(await Store.allNotes()); // Refresh list to show active note
  },

  async newNote() {
    const n = Note.create({ title: 'Untitled', body: '', tags: [] });
    await Store.upsert(n);
    await this.refreshHomePage();
    await this.openNote(n.id);
  },

  async save() {
    const id = this.state.currentId;
    if (!id) return;

    const n = await Store.get(id);
    const titleEl = el('#title');
    const editorEl = el('#editor');
    
    if(!titleEl || !editorEl) return;
    
    n.title = titleEl.value.trim() || '(untitled)';
    n.body = editorEl.value;
    n.tags = [...new Set((n.body.match(/#[a-z0-9_\-]+/gi) || []).map(t => t.toLowerCase()))];
    
    if (this.state.autoLink) {
      const all = await Store.allNotes();
      Note.computeLinks(n, all);
    }
    n.updatedAt = nowISO();
    await Store.upsert(n);
    const dirty = el('#dirty');
    if(dirty) dirty.classList.add('hidden');
    toast('Saved');
    await this.refreshHomePage();
    if (this.bc) this.bc.postMessage({ type: 'sync' });
  },

  // --- RENDERING LOGIC ---

  renderNoteList(notes) {
    const box = el('#noteList');
    if (!box) return;

    const sorted = [...notes].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    box.innerHTML = '';
    for (const n of sorted) {
      const div = document.createElement('div');
      const isActive = n.id === this.state.currentId;
      div.className = `p-2 rounded cursor-pointer ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`;
      div.innerHTML = `
        <div class="font-semibold text-white truncate">${n.title || '(untitled)'}</div>
        <div class="text-xs text-gray-400">${(n.updatedAt || n.createdAt).slice(0, 10)}</div>
      `;
      div.onclick = () => this.openNote(n.id);
      box.appendChild(div);
    }
    const noteCount = el('#noteCount');
    if(noteCount) noteCount.textContent = notes.length;
  },

  renderPreviewLive() {
    const editor = el('#editor');
    const preview = el('#preview');
    if (!editor || !preview) return;
    
    const md = editor.value;
    if(typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined'){
        preview.innerHTML = DOMPurify.sanitize(marked.parse(md));
    } else {
        preview.textContent = md;
    }
  },

  async renderTagManager() {
      const notes = await Store.allNotes();
      const tagBox = el('#allTagsList');
      if (!tagBox) return;
      tagBox.innerHTML = '';
      const counts = {};
      for (const n of notes) for (const t of (n.tags || [])) counts[t] = (counts[t] || 0) + 1;
      const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      for (const [t, c] of items) {
          const div = document.createElement('div');
          div.className = 'flex justify-between items-center p-2 hover:bg-gray-700 rounded';
          div.innerHTML = `<span>${t}</span><span class="text-sm text-gray-400 bg-gray-600 px-2 rounded-full">${c}</span>`;
          tagBox.appendChild(div);
      }
      const totalTagCount = el('#totalTagCount');
      if(totalTagCount) totalTagCount.textContent = items.length;
  },
  
  async createNewTagFromManager() {
      const newTagInput = el('#newTagInput');
      if (!newTagInput || !newTagInput.value.trim()) return;
      let tagName = newTagInput.value.trim();
      if (!tagName.startsWith('#')) tagName = '#' + tagName;
      console.log(`New tag created: ${tagName}`);
      newTagInput.value = '';
      await this.renderTagManager();
      toast(`Tag ${tagName} created`);
  },

  async seed() {
    console.log('Seeding database...');
    const a = Note.create({ title: 'Welcome to Mahart Notes', tags: ['#welcome'], body: 'This is your first note. Select it from the list on the left.\n\n## Color-coded Notes\nYou can now assign colors to notes using the color button in the editor header. This helps organize your thoughts visually!', color: '#3B82F6' });
    const b = Note.create({ title: 'How to use', tags: ['#guide'], body: '## Linking\nLink notes with [[Title]].\n\n## Tags\nAdd tags with #tags.\n\n## Graph Views\nVisit the Graph page to see your notes connected by tags or colors!', color: '#10B981' });
    const c = Note.create({ title: 'Advanced Features', tags: ['#features', '#advanced'], body: '## New in v2.1\n\n- **Enhanced Search**: Use advanced filters and search operators\n- **Analytics Dashboard**: Track your knowledge growth\n- **Smart Templates**: Quick-start templates for different note types\n- **AI Recommendations**: Get suggestions for connecting ideas\n- **Learning Mode**: Quiz yourself on your notes\n\nExplore these features from the enhanced sidebar!', color: '#8B5CF6' });
    const all = [a, b, c];
    for (const n of all) Note.computeLinks(n, all);
    await Store.saveNotes(all);
  },
};
