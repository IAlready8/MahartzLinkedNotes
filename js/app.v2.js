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
    const notes = await Store.allNotes();
    const graphContainer = el('#graphContainer');
    if (graphContainer && typeof Graph !== 'undefined') {
        Graph.render(graphContainer, notes);
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
        if(window.location.hash === '#/){
            this.save(); 
        }
      }
    });
  },

  bindHomePageEvents() {
    el('#saveNoteInline').onclick = () => this.save();
    el('#editor').addEventListener('input', debounce(() => {
        el('#dirty').classList.remove('hidden');
        this.renderPreviewLive();
    }, 250));
    el('#title').addEventListener('input', () => { el('#dirty').classList.remove('hidden'); });
  },
  
  bindTagsPageEvents() {
      const button = el('#newTagInput')?.nextElementSibling;
      if(button) button.onclick = () => this.createNewTagFromManager();
  },
  
  bindSettingsPageEvents() {
      el('#autoLink').onchange = (e) => this.state.autoLink = e.target.checked;
      el('#enableAnalytics').onchange = (e) => { this.state.analytics = e.target.checked; if(typeof Analytics !== 'undefined') Analytics.enabled = e.target.checked; };
      el('#enableBC').onchange = (e) => { this.state.bc = e.target.checked; this.bc && this.bc.close(); this.bc = this.state.bc ? new BroadcastChannel('mahart-notes') : null; };
  },

  // --- CORE LOGIC ---

  async refreshCurrentPage() {
      const path = window.location.hash || '#/';
      console.log(`Refreshing page: ${path}`);
      if (path === '#/') await this.refreshHomePage();
      if (path === '#/tags') await this.renderTagManager();
      if (path === '#/graph') await this.initGraphPage();
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
    if(titleEl) titleEl.value = n.title || '';
    if(editorEl) editorEl.value = n.body || '';
    
    el('#dirty').classList.add('hidden');
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
    n.title = el('#title').value.trim() || '(untitled)';
    n.body = el('#editor').value;
    n.tags = [...new Set((n.body.match(/#[a-z0-9_\-]+\/gi) || []).map(t => t.toLowerCase()))];
    
    if (this.state.autoLink) {
      const all = await Store.allNotes();
      Note.computeLinks(n, all);
    }
    n.updatedAt = nowISO();
    await Store.upsert(n);
    el('#dirty').classList.add('hidden');
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
    el('#noteCount').textContent = notes.length;
  },

  renderPreviewLive() {
    const md = el('#editor')?.value;
    const preview = el('#preview');
    if (md === undefined || !preview) return;
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
      el('#totalTagCount').textContent = items.length;
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
    const a = Note.create({ title: 'Welcome to Mahart Notes', tags: ['#welcome'], body: 'This is your first note. Select it from the list on the left.' });
    const b = Note.create({ title: 'How to use', tags: ['#guide'], body: '## Linking
Link notes with [[Title]].

## Tags
Add tags with #tags.' });
    const all = [a, b];
    for (const n of all) Note.computeLinks(n, all);
    await Store.saveNotes(all);
  },
};
