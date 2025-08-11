/* app.js — UI + orchestration */
const UI = {
  state:{ currentId:null, autoLink:true, analytics:true, bc:true, selectedNotes:new Set(), bulkMode:false },
  bc:null,
  tagInput:null,
  async init(){
    // Wait a bit for all dependencies to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      Analytics.startMark('init');
      this.hookKeys();
      this.bind();
      if(this.state.bc) this.bc = new BroadcastChannel('mahart-notes');
      if(this.bc) this.bc.onmessage = async (e)=>{ if(e.data?.type==='sync'){ await this.refresh(); }};
      // Initialize enhanced tag system
      this.initTagSystem();
      // Initialize collaboration
      if (typeof Collaboration !== 'undefined') {
        await Collaboration.init();
      }
      // Initialize advanced UI
      if (typeof AdvancedUI !== 'undefined') {
        AdvancedUI.init();
      }
      // Initialize plugin system
      if (typeof PluginSystem !== 'undefined') {
        await PluginSystem.init();
      }
      // Initialize data management
      if (typeof DataManagement !== 'undefined') {
        await DataManagement.init();
      }
      // Initialize advanced search
      if (typeof AdvancedSearch !== 'undefined') {
        await AdvancedSearch.init();
      }
      // Initialize advanced editor
      if (typeof AdvancedEditor !== 'undefined') {
        await AdvancedEditor.init();
      }
      // Initialize monetization
      if (typeof Monetization !== 'undefined') {
        await Monetization.init();
      }
      // Initialize workspace
      if (typeof Workspace !== 'undefined') {
        await Workspace.init();
      }
      // Initialize themes
      if (typeof Themes !== 'undefined') {
        await Themes.init();
      }
      // seed if empty
      const notes = await Store.allNotes();
      if(!notes.length) await this.seed();
      await this.refresh();
      Analytics.endMark('init');
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Try to create a simple note to get started
      await this.createFallbackNote();
      await this.refresh();
    }
  },
  async seed(){
    const a = Note.create({title:'Zettelkasten Primer', tags:['#method','#zettel'], body: `
# Zettelkasten Primer
- Capture atomic ideas.
- Link liberally with [[Links]] to create structure.
- Use #tags for quick slicing.

See [[Workflow Guide]] and [[ID:seed-analytics]].
`});
    a.id = 'seed-primer';
    const b = Note.create({title:'Workflow Guide', tags:['#guide'], body: `
# Workflow Guide
1. Create note (⌘/Ctrl+N)
2. Title, write short atomic idea
3. Link to parent/sibling [[Zettelkasten Primer]]
4. Add 2+ links to strengthen graph
`});
    b.id = 'seed-workflow';
    const c = Note.create({title:'Analytics Playbook', tags:['#analytics','#metrics'], body: `
# Analytics Playbook
- Effectiveness: % notes with ≥2 links
- Link density: avg links/note
- Momentum: notes updated/day (14d)
- Usage: create/edit/open events
`});
    c.id = 'seed-analytics';
    const all = [a,b,c];
    // compute links
    for(const n of all) Note.computeLinks(n, all);
    await Store.saveNotes(all);
    await Store.log({id:ULID(),evt:'seed',t:Date.now()});
  },
  async createFallbackNote() {
    try {
      const note = Note.create({
        title: 'Welcome to Mahart Notes',
        body: '# Welcome!\n\nThis is your first note.\n\nTry creating a new note with the "New Note" button.\n\nYou can link notes using [[Note Title]] syntax and add tags like #example.',
        tags: ['#welcome', '#example']
      });
      await Store.upsert(note);
      console.log('Created fallback note');
    } catch (error) {
      console.error('Failed to create fallback note:', error);
    }
  },
  hookKeys(){
    window.addEventListener('keydown', (e)=>{
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); el('#q').focus(); }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='n'){ e.preventDefault(); this.newNote(); }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); this.save(); }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='p'){ e.preventDefault(); 
        if (typeof AdvancedUI !== 'undefined') {
          AdvancedUI.showCommandPalette();
        }
      }
      // Enhanced editor shortcuts
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='f'){ e.preventDefault();
        if (typeof AdvancedEditor !== 'undefined') {
          AdvancedEditor.showFindReplace();
        }
      }
      
      // Version history shortcut
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='h'){ e.preventDefault();
        UI.showHistoryPanel();
      }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='d'){ e.preventDefault();
        if (typeof AdvancedEditor !== 'undefined') {
          AdvancedEditor.toggleDistractionFree();
        }
      }
      // Theme cycling
      if((e.metaKey||e.ctrlKey) && e.shiftKey && e.key.toLowerCase()==='t'){ e.preventDefault();
        if (typeof Themes !== 'undefined') {
          Themes.cycleThemes();
        }
      }
    });
  },
  bind(){
    // Wait for elements to be available
    setTimeout(() => {
      const newNoteBtn = el('#newNote');
      const templateBtn = el('#templateBtn');
      const templateMenu = el('#templateMenu');
      const saveNoteBtn = el('#saveNote');
      const graphBtn = el('#graphBtn');
      const exportBtn = el('#exportBtn');
      const importBtn = el('#importBtn');
      const settingsBtn = el('#settingsBtn');
      const editor = el('#editor');
      const title = el('#title');
      const q = el('#q');
      const importFile = el('#importFile');
      const autoLink = el('#autoLink');
      const enableAnalytics = el('#enableAnalytics');
      const enableBC = el('#enableBC');
      
      if (newNoteBtn) newNoteBtn.onclick=()=>this.newNote();
      if (templateBtn) {
        templateBtn.onclick = (e) => {
          e.stopPropagation();
          this.showTemplateMenu();
        };
      }
      if (saveNoteBtn) saveNoteBtn.onclick=()=>this.save();
      if (graphBtn) graphBtn.onclick=()=>this.showGraph();
      if (exportBtn) exportBtn.onclick=()=>this.export();
      if (importBtn) importBtn.onclick=()=>{ if(importFile) importFile.click(); };
      if (settingsBtn) settingsBtn.onclick=()=>{ const settings = el('#settings'); if(settings) settings.showModal(); };
      if (autoLink) autoLink.onchange=(e)=>this.state.autoLink=e.target.checked;
      if (enableAnalytics) enableAnalytics.onchange=(e)=>{ this.state.analytics=e.target.checked; if(typeof Analytics !== 'undefined') Analytics.enabled=e.target.checked; };
      if (enableBC) enableBC.onchange=(e)=>{ this.state.bc=e.target.checked; this.bc && this.bc.close(); this.bc=this.state.bc? new BroadcastChannel('mahart-notes'):null; };
      if (q) q.addEventListener('input', debounce(()=>this.search(q.value), 120));
      if (editor) editor.addEventListener('input', ()=>{ const dirty = el('#dirty'); if(dirty) dirty.style.display='inline-block'; this.renderPreview(); });
      if (title) title.addEventListener('input', ()=> { const dirty = el('#dirty'); if(dirty) dirty.style.display='inline-block'; });
      
      // Enhanced tag system bindings
      const tagStatsBtn = el('#tagStatsBtn');
      const bulkTagBtn = el('#bulkTagBtn');
      if (tagStatsBtn) tagStatsBtn.onclick = ()=> this.toggleTagStats();
      if (bulkTagBtn) bulkTagBtn.onclick = ()=> this.toggleBulkMode();
      
      if (el('#preview')) {
        el('#preview').addEventListener('click', (e)=>{
          const a = e.target.closest('a.link'); if(!a) return;
          const token = decodeURIComponent(a.dataset.wikilink);
          this.followWiki(token);
        });
      }
      
      const tags = els('.left .tag');
      tags.forEach(x=> {
        if (x.textContent) {
          x.addEventListener('click', ()=>this.filterTag(x.textContent.trim()));
        }
      });
      
      // Close template menu when clicking outside
      document.addEventListener('click', (e) => {
        if (templateMenu && !templateMenu.contains(e.target) && templateBtn !== e.target) {
          templateMenu.style.display = 'none';
        }
      });
      
      // Filter panel bindings
      const filterPanel = el('#filterPanel');
      if (filterPanel) {
        const applyFiltersBtn = el('#applyFilters');
        const clearFiltersBtn = el('#clearFilters');
        const filterTags = el('#filterTags');
        const filterDateFrom = el('#filterDateFrom');
        const filterDateTo = el('#filterDateTo');
        const filterMinLinks = el('#filterMinLinks');
        const filterHasBacklinks = el('#filterHasBacklinks');
        
        if (applyFiltersBtn) applyFiltersBtn.onclick = () => this.applyFilters();
        if (clearFiltersBtn) clearFiltersBtn.onclick = () => this.clearFilters();
        
        // Close filter panel when clicking outside
        document.addEventListener('click', (e) => {
          if (filterPanel && !filterPanel.contains(e.target) && 
              filterBtn !== e.target && !filterBtn.contains(e.target)) {
            filterPanel.style.display = 'none';
          }
        });
      }
      
      // Recommendations bindings
      const refreshRecsBtn = el('#refreshRecsBtn');
      if (refreshRecsBtn) refreshRecsBtn.onclick = ()=> this.renderRecommendations();
      
      // AI Assistant bindings
      const aiAssistantBtn = el('#aiAssistantBtn');
      const aiAssistantQuickBtn = el('#aiAssistantQuickBtn');
      if (aiAssistantBtn) aiAssistantBtn.onclick = ()=> this.showAIAssistant();
      if (aiAssistantQuickBtn) aiAssistantQuickBtn.onclick = ()=> this.showAIAssistant();
      
      // Advanced search button
      const filterBtn = el('#filterBtn');
      if (filterBtn) filterBtn.onclick = () => {
        if (typeof AdvancedSearch !== 'undefined') {
          AdvancedSearch.showAdvancedSearch();
        }
      };
      
      // Data management buttons
      const backupBtn = el('#backupBtn');
      const syncBtn = el('#syncBtn');
      if (backupBtn) backupBtn.onclick = () => {
        if (typeof DataManagement !== 'undefined') {
          DataManagement.showBackupModal();
        }
      };
      if (syncBtn) syncBtn.onclick = () => {
        if (typeof DataManagement !== 'undefined') {
          DataManagement.showSyncModal();
        }
      };
    }, 100);
  },
  async refresh(){
    try {
      const notes = await Store.allNotes();
      // recompute links
      for(const n of notes) Note.computeLinks(n, notes);
      await Store.saveNotes(notes);
      Search.buildIndex(notes);
      this.renderList(notes);
      this.renderTags(notes);
      this.renderBacklinks();
      this.renderKPI(notes);
      this.renderMiniGraph(notes);
      this.renderRecommendations();
      const perfBox = el('#perfBox');
      if(perfBox && typeof Analytics !== 'undefined') perfBox.textContent = Analytics.perfDump();
      
      // Update status bar
      if (typeof AdvancedUI !== 'undefined') {
        AdvancedUI.updateStatusBar();
      }
      
      // Update plugin system
      if (typeof PluginSystem !== 'undefined') {
        // Refresh plugin UI
      }
      
      // Update workspace
      if (typeof Workspace !== 'undefined') {
        // Refresh workspace UI
      }
    } catch (error) {
      console.error('Failed to refresh UI:', error);
    }
  },
  renderList(notes){
    const box = el('#noteList');
    if (!box) return;
    box.innerHTML='';
    const sorted = [...notes].sort((a,b)=> (b.updatedAt||'').localeCompare(a.updatedAt||''));
    for(const n of sorted){
      const div = document.createElement('div');
      div.className='item';
      div.dataset.noteId = n.id; // Add note ID for bulk operations
      div.innerHTML = `<div style="padding:6px 4px;cursor:pointer">
        <div>${n.title||'(untitled)'} <span class="badge">#${n.tags?n.tags.length:0} tags</span> <span class="badge">${n.links?n.links.length:0} links</span></div>
        <div class="small">${(n.updatedAt||n.createdAt).slice(0,16).replace('T',' ')}</div>
      </div>`;
      div.onclick = ()=> this.openNote(n.id);
      box.appendChild(div);
    }
    const noteCount = el('#noteCount');
    if (noteCount) noteCount.textContent = notes.length;
    
    // Re-render bulk selection if in bulk mode
    if(this.state.bulkMode) {
      setTimeout(() => this.renderNoteSelection(), 100);
    }
  },
  renderTags(notes){
    const tagBox = el('#tagList');
    if (!tagBox) return;
    tagBox.innerHTML='';
    const counts = {};
    for(const n of notes) for(const t of (n.tags||[])) counts[t]=(counts[t]||0)+1;
    const items = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,80);
    for(const [t,c] of items){
      const span = document.createElement('span');
      let color = '#6B7280'; // default gray
      let category = 'custom';
      
      // Try to get color from TagManager if available
      if (typeof TagManager !== 'undefined') {
        color = TagManager.getTagColor ? TagManager.getTagColor(t) : color;
        category = TagManager.getTagCategory ? TagManager.getTagCategory(t) : category;
      }
      
      span.className = `tag tag-category-${category}`;
      span.style.borderLeftColor = color;
      span.textContent = `${t} (${c})`;
      span.onclick=()=> this.filterTag(t);
      tagBox.appendChild(span);
    }
    const tagCount = el('#tagCount');
    if (tagCount) tagCount.textContent = items.length;
  },
  renderBacklinks(){
    const id = this.state.currentId;
    const box = el('#backlinks');
    if (!box) return;
    box.innerHTML='';
    if(!id) return;
    Store.allNotes().then(notes=>{
      const list = Note.backlinks(id, notes);
      for(const n of list){
        const div = document.createElement('div');
        div.innerHTML = `<a class="link">${n.title||n.id}</a>`;
        div.onclick=()=>this.openNote(n.id);
        box.appendChild(div);
      }
    }).catch(console.error);
  },

  async renderRecommendations(){
    const id = this.state.currentId;
    const panel = el('#recommendationsPanel');
    const list = el('#recommendationsList');
    
    if (!panel || !list) return;
    
    // Show panel when a note is open
    if(id) {
      panel.style.display = 'block';
      
      // Show loading state
      list.innerHTML = '<div style="color: var(--muted); font-style: italic;">Finding recommendations...</div>';
      
      try {
        // Get recommendations
        const recommendations = typeof Recommendations !== 'undefined' 
          ? await Recommendations.getRecommendations(id, 5)
          : [];
        
        if(recommendations.length > 0) {
          list.innerHTML = '';
          recommendations.forEach(note => {
            const div = document.createElement('div');
            div.style.padding = '4px 0';
            div.style.borderBottom = '1px solid #1a2133';
            div.innerHTML = `
              <a class="link" style="display: block; margin-bottom: 2px;">${note.title||note.id}</a>
              <div style="font-size: 11px; color: var(--muted);">
                ${note.tags ? note.tags.slice(0, 3).join(', ') : ''}
                ${note.links && note.links.length ? ` • ${note.links.length} links` : ''}
              </div>
            `;
            div.onclick = () => this.openNote(note.id);
            list.appendChild(div);
          });
        } else {
          list.innerHTML = '<div style="color: var(--muted); font-style: italic;">No recommendations found</div>';
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        list.innerHTML = '<div style="color: var(--bad); font-style: italic;">Failed to load recommendations</div>';
      }
    } else {
      panel.style.display = 'none';
    }
  },
  renderPreview(){
    const editor = el('#editor');
    const preview = el('#preview');
    if (!editor || !preview) return;
    const md = editor.value;
    if (typeof renderMD !== 'undefined') {
      preview.innerHTML = renderMD(md);
    } else {
      // Fallback rendering
      preview.textContent = md;
    }
  },
  renderKPI(notes){
    if (typeof Analytics === 'undefined') return;
    const k = Analytics.derive(notes);
    const kpiNotes = el('#kpiNotes');
    const kpiLinks = el('#kpiLinks');
    const kpiHealth = el('#kpiHealth');
    
    if (kpiNotes) kpiNotes.textContent = k.total;
    if (kpiLinks) kpiLinks.textContent = k.linksPer;
    if (kpiHealth) kpiHealth.textContent = k.pct2+'%';
    
    // activity chart
    const chartActivity = el('#chartActivity');
    if(chartActivity && typeof Chart !== 'undefined') {
      const ctx = chartActivity.getContext('2d');
      if(this._chart) this._chart.destroy();
      this._chart = new Chart(ctx, { type:'line', data:{
        labels:Object.keys(k.daily),
        datasets:[{ label:'Notes updated', data:Object.values(k.daily) }]
      }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }});
    }
  },
  renderMiniGraph(notes){
    const miniGraph = el('#miniGraph');
    if(miniGraph && typeof Graph !== 'undefined' && typeof Graph.render === 'function') {
      Graph.render(miniGraph, notes);
    } else if (miniGraph) {
      miniGraph.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280">Graph will appear here</div>';
    }
  },
  async openNote(id){
    const n = await Store.get(id); if(!n) return;
    this.state.currentId = n.id;
    const title = el('#title');
    const editor = el('#editor');
    const dirty = el('#dirty');
    
    if (title) title.value = n.title||'';
    // Update enhanced tag input
    if(this.tagInput) {
      this.tagInput.setTags(n.tags || []);
    }
    if (editor) editor.value = n.body||'';
    if (dirty) dirty.style.display='none';
    this.renderPreview();
    this.renderBacklinks();
    this.renderRecommendations();
    
    // Enhance editor for this note
    if (typeof AdvancedEditor !== 'undefined') {
      AdvancedEditor.enhanceEditor(id);
    }
    
    if(typeof Analytics !== 'undefined') Analytics.log('open', {id});
  },
  async newNote(){
    const n = Note.create({ title:'', body:'', tags:[] });
    await Store.upsert(n);
    await this.openNote(n.id);
    const notes = await Store.allNotes();
    await this.refresh();
    if(typeof Analytics !== 'undefined') Analytics.log('create', {id:n.id});
  },
  
  // Show version history panel
  async showHistoryPanel() {
    const id = this.state.currentId;
    if (!id) return;
    
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const restoreVersionBtn = document.getElementById('restoreVersionBtn');
    const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
    
    if (!historyPanel || !historyList) return;
    
    // Get versions
    let versions = [];
    if (typeof AdvancedEditor !== 'undefined') {
      versions = await AdvancedEditor.getVersions(id);
    }
    
    // Render versions
    if (versions.length > 0) {
      historyList.innerHTML = versions.map((version, index) => `
        <div class="version-item" data-version-id="${version.id}" style="padding: 12px; border-bottom: 1px solid #1a2133; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Version ${versions.length - index}</strong>
              <div class="small" style="color: var(--muted);">Saved: ${new Date(version.createdAt).toLocaleString()}</div>
            </div>
            <div class="small" style="color: var(--muted);">${version.title || 'Untitled'}</div>
          </div>
        </div>
      `).join('');
      
      // Add event listeners to version items
      historyList.querySelectorAll('.version-item').forEach((item, index) => {
        item.addEventListener('click', () => {
          // Highlight selected version
          historyList.querySelectorAll('.version-item').forEach(i => {
            i.style.background = '';
          });
          item.style.background = '#111624';
          
          // Enable restore button
          if (restoreVersionBtn) {
            restoreVersionBtn.disabled = false;
            restoreVersionBtn.onclick = async () => {
              await AdvancedEditor.restoreVersion(versions[index]);
              this.showHistoryPanel(); // Refresh panel
            };
          }
        });
      });
    } else {
      historyList.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--muted);">No version history found</div>';
      if (restoreVersionBtn) restoreVersionBtn.disabled = true;
    }
    
    // Show panel
    historyPanel.style.display = 'block';
    
    // Bind close button
    if (closeHistoryBtn) {
      closeHistoryBtn.onclick = () => {
        historyPanel.style.display = 'none';
        if (restoreVersionBtn) restoreVersionBtn.disabled = true;
      };
    }
    
    // Bind delete history button
    if (deleteHistoryBtn) {
      deleteHistoryBtn.onclick = async () => {
        if (confirm('Are you sure you want to delete all version history for this note?')) {
          const versionsKey = `note_versions_${id}`;
          localStorage.removeItem(versionsKey);
          this.showHistoryPanel(); // Refresh panel
          toast('Version history deleted');
        }
      };
    }
  },

  showTemplateMenu(){
    const templateMenu = el('#templateMenu');
    const templateBtn = el('#templateBtn');
    if (!templateMenu || !templateBtn) return;
    
    // Toggle menu visibility
    const isVisible = templateMenu.style.display !== 'none';
    if (isVisible) {
      templateMenu.style.display = 'none';
      return;
    }
    
    // Position menu below button
    const rect = templateBtn.getBoundingClientRect();
    templateMenu.style.top = (rect.bottom + window.scrollY) + 'px';
    templateMenu.style.left = (rect.left + window.scrollX) + 'px';
    
    // Populate menu with templates
    if (typeof Templates !== 'undefined') {
      const templates = Templates.getAll();
      templateMenu.innerHTML = '';
      
      templates.forEach(templateName => {
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.textContent = templateName.charAt(0).toUpperCase() + templateName.slice(1);
        item.onclick = () => {
          this.createTemplatedNote(templateName);
          templateMenu.style.display = 'none';
        };
        templateMenu.appendChild(item);
      });
      
      // Add a separator
      const separator = document.createElement('hr');
      separator.style.border = '0';
      separator.style.borderTop = '1px solid #1a2133';
      separator.style.margin = '4px 0';
      templateMenu.appendChild(separator);
      
      // Add "Blank Note" option
      const blankItem = document.createElement('div');
      blankItem.className = 'menu-item';
      blankItem.textContent = 'Blank Note';
      blankItem.onclick = () => {
        this.newNote();
        templateMenu.style.display = 'none';
      };
      templateMenu.appendChild(blankItem);
    }
    
    templateMenu.style.display = 'block';
  },

  async createTemplatedNote(templateName){
    if (typeof Templates === 'undefined') {
      this.newNote();
      return;
    }
    
    // Get title from user
    const title = prompt('Enter note title:', templateName.charAt(0).toUpperCase() + templateName.slice(1));
    if (!title) return;
    
    // Apply template
    const templateData = Templates.apply(templateName, { title });
    if (!templateData) {
      toast('Template not found');
      return;
    }
    
    // Create note with template data
    const n = Note.create({
      title: templateData.title,
      body: templateData.body,
      tags: templateData.tags
    });
    
    await Store.upsert(n);
    await this.openNote(n.id);
    const notes = await Store.allNotes();
    await this.refresh();
    if(typeof Analytics !== 'undefined') Analytics.log('create_template', {id:n.id, template: templateName});
  },
  async save(){
    const id = this.state.currentId;
    if(!id){ await this.newNote(); return; }
    const n = await Store.get(id);
    const title = el('#title');
    const editor = el('#editor');
    
    if (title) n.title = title.value.trim() || n.title || '(untitled)';
    n.tags = this.tagInput ? this.tagInput.getTags() : [];
    if (editor) n.body = editor.value;
    if(this.state.autoLink){
      const all = await Store.allNotes();
      Note.computeLinks(n, all);
    }
    n.updatedAt = nowISO();
    await Store.upsert(n);
    const dirty = el('#dirty');
    if (dirty) dirty.style.display='none';
    toast('Saved');
    await this.refresh();
    if(typeof Analytics !== 'undefined') Analytics.log('save', {id});
    if(this.bc) this.bc.postMessage({type:'sync'});
    
    // Notify collaboration system
    if (typeof Collaboration !== 'undefined') {
      Collaboration.sendNoteChange(n);
    }
  },

  toggleHistoryPanel(){
    const historyPanel = el('#historyPanel');
    const editorCard = document.querySelector('.main .card:first-child');
    if (!historyPanel || !editorCard) return;
    
    // Toggle visibility
    const isVisible = historyPanel.style.display !== 'none';
    if (isVisible) {
      historyPanel.style.display = 'none';
      editorCard.style.display = 'flex'; // Show editor
      return;
    }
    
    // Hide editor and show history
    editorCard.style.display = 'none';
    historyPanel.style.display = 'flex';
    
    // Load history
    this.loadVersionHistory();
  },

  async loadVersionHistory(){
    const id = this.state.currentId;
    const historyList = el('#historyList');
    const restoreBtn = el('#restoreVersionBtn');
    const deleteBtn = el('#deleteHistoryBtn');
    
    if (!historyList || !restoreBtn || !deleteBtn) return;
    
    if (!id) {
      historyList.innerHTML = '<div style="color: var(--muted); text-align: center;">No note selected</div>';
      restoreBtn.disabled = true;
      return;
    }
    
    try {
      historyList.innerHTML = '<div style="color: var(--muted); text-align: center;">Loading history...</div>';
      
      const versions = await Store.getVersions(id);
      
      if (versions.length === 0) {
        historyList.innerHTML = '<div style="color: var(--muted); text-align: center;">No version history available</div>';
        restoreBtn.disabled = true;
        return;
      }
      
      historyList.innerHTML = '';
      restoreBtn.disabled = true;
      
      // Add event listeners to restore and delete buttons
      const closeHistoryBtn = el('#closeHistoryBtn');
      if (closeHistoryBtn) {
        closeHistoryBtn.onclick = () => this.toggleHistoryPanel();
      }
      
      deleteBtn.onclick = async () => {
        if (confirm('Delete all version history for this note? This cannot be undone.')) {
          await Store.deleteAllVersions(id);
          this.loadVersionHistory();
          toast('History deleted');
        }
      };
      
      // Create version list
      versions.forEach((version, index) => {
        const versionEl = document.createElement('div');
        versionEl.className = 'version-item';
        versionEl.style.padding = '8px';
        versionEl.style.borderBottom = '1px solid #1a2133';
        versionEl.style.cursor = 'pointer';
        versionEl.dataset.versionId = version.versionId;
        
        const versionDate = new Date(version.versionedAt || version.updatedAt || version.createdAt);
        const formattedDate = versionDate.toLocaleString();
        
        // Calculate content difference
        const currentNote = index === 0 ? ' (current)' : '';
        const contentDiff = this.calculateContentDifference(version, index, versions);
        
        versionEl.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${formattedDate}</strong>${currentNote}
              <div style="font-size: 12px; color: var(--muted);">${contentDiff}</div>
            </div>
            ${index === 0 ? '<span class="badge" style="font-size: 10px;">Current</span>' : ''}
          </div>
        `;
        
        versionEl.onclick = () => {
          // Highlight selected version
          document.querySelectorAll('.version-item').forEach(el => {
            el.style.background = 'transparent';
          });
          versionEl.style.background = '#111624';
          
          // Enable restore button for non-current versions
          restoreBtn.disabled = index === 0;
          restoreBtn.onclick = index === 0 ? null : () => this.restoreVersion(version.versionId);
        };
        
        historyList.appendChild(versionEl);
      });
    } catch (error) {
      console.error('Failed to load version history:', error);
      historyList.innerHTML = '<div style="color: var(--bad); text-align: center;">Failed to load version history</div>';
      restoreBtn.disabled = true;
    }
  },

  calculateContentDifference(version, index, allVersions) {
    if (index === allVersions.length - 1) {
      return 'Initial version';
    }
    
    const nextVersion = allVersions[index + 1];
    if (!nextVersion) return '';
    
    let changes = [];
    
    if (version.title !== nextVersion.title) {
      changes.push('title');
    }
    
    if (version.body !== nextVersion.body) {
      changes.push('content');
    }
    
    const versionTags = new Set(version.tags || []);
    const nextTags = new Set(nextVersion.tags || []);
    const tagChanges = [...versionTags].filter(tag => !nextTags.has(tag)).length + 
                      [...nextTags].filter(tag => !versionTags.has(tag)).length;
    
    if (tagChanges > 0) {
      changes.push('tags');
    }
    
    if (changes.length === 0) return 'No changes';
    return changes.join(', ') + ' changed';
  },

  async restoreVersion(versionId) {
    const id = this.state.currentId;
    if (!id || !versionId) return;
    
    if (confirm('Restore this version? Current changes will be saved as a new version.')) {
      try {
        const restored = await Store.restoreVersion(id, versionId);
        if (restored) {
          await this.openNote(id);
          this.toggleHistoryPanel(); // Close history panel
          toast('Version restored');
        } else {
          toast('Failed to restore version');
        }
      } catch (error) {
        console.error('Failed to restore version:', error);
        toast('Failed to restore version');
      }
    }
  },
  async search(q){
    if(typeof Search === 'undefined' || typeof Search.query !== 'function') return;
    const ids = Search.query(q);
    const notes = await Store.allNotes();
    const set = new Set(ids);
    this.renderList(notes.filter(n=> set.has(n.id)));
  },

  toggleFilterPanel(){
    const filterPanel = el('#filterPanel');
    const filterBtn = el('#filterBtn');
    if (!filterPanel || !filterBtn) return;
    
    // Toggle visibility
    const isVisible = filterPanel.style.display !== 'none';
    if (isVisible) {
      filterPanel.style.display = 'none';
      return;
    }
    
    // Position panel near the filter button
    const rect = filterBtn.getBoundingClientRect();
    filterPanel.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    filterPanel.style.right = (window.innerWidth - rect.right + window.scrollX) + 'px';
    
    // Pre-populate with current filters
    this.populateFilterPanel();
    
    filterPanel.style.display = 'block';
  },

  populateFilterPanel(){
    const filterTags = el('#filterTags');
    const filterDateFrom = el('#filterDateFrom');
    const filterDateTo = el('#filterDateTo');
    const filterMinLinks = el('#filterMinLinks');
    const filterHasBacklinks = el('#filterHasBacklinks');
    
    if (filterTags) filterTags.value = Search.filters.tags.join(', ');
    if (filterDateFrom) filterDateFrom.value = Search.filters.dateFrom || '';
    if (filterDateTo) filterDateTo.value = Search.filters.dateTo || '';
    if (filterMinLinks) filterMinLinks.value = Search.filters.minLinks || '';
    if (filterHasBacklinks) filterHasBacklinks.checked = Search.filters.hasBacklinks;
  },

  applyFilters(){
    const filterTags = el('#filterTags');
    const filterDateFrom = el('#filterDateFrom');
    const filterDateTo = el('#filterDateTo');
    const filterMinLinks = el('#filterMinLinks');
    const filterHasBacklinks = el('#filterHasBacklinks');
    
    // Collect filter values
    const filters = {};
    
    if (filterTags && filterTags.value.trim()) {
      filters.tags = filterTags.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => tag.startsWith('#') ? tag : '#' + tag);
    }
    
    if (filterDateFrom && filterDateFrom.value) {
      filters.dateFrom = filterDateFrom.value;
    }
    
    if (filterDateTo && filterDateTo.value) {
      filters.dateTo = filterDateTo.value;
    }
    
    if (filterMinLinks && filterMinLinks.value) {
      filters.minLinks = parseInt(filterMinLinks.value);
    }
    
    if (filterHasBacklinks) {
      filters.hasBacklinks = filterHasBacklinks.checked;
    }
    
    // Apply filters
    Search.setFilters(filters);
    
    // Close panel
    const filterPanel = el('#filterPanel');
    if (filterPanel) filterPanel.style.display = 'none';
    
    // Re-run current search with new filters
    const q = el('#q');
    if (q) this.search(q.value);
  },

  clearFilters(){
    // Clear filters in search module
    Search.clearFilters();
    
    // Clear form fields
    const filterTags = el('#filterTags');
    const filterDateFrom = el('#filterDateFrom');
    const filterDateTo = el('#filterDateTo');
    const filterMinLinks = el('#filterMinLinks');
    const filterHasBacklinks = el('#filterHasBacklinks');
    
    if (filterTags) filterTags.value = '';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    if (filterMinLinks) filterMinLinks.value = '';
    if (filterHasBacklinks) filterHasBacklinks.checked = false;
    
    // Re-run search
    const q = el('#q');
    if (q) this.search(q.value);
  },
  async filterTag(t){
    const notes = await Store.allNotes();
    this.renderList(notes.filter(n=> (n.tags||[]).includes(t)));
  },
  async followWiki(token){
    if(token.toLowerCase().startsWith('id:')){
      const id = token.split(':')[1].trim();
      return this.openNote(id);
    }
    // find by title else create
    let n = await Store.byTitle(token);
    if(!n){
      n = Note.create({ title: token, body: `# ${token}\n\nLinked from [[${(await Store.get(this.state.currentId))?.title||'unknown'}]]` });
      await Store.upsert(n);
      if(typeof Analytics !== 'undefined') Analytics.log('autocreate_from_wikilink', {id:n.id, title:token});
    }
    this.openNote(n.id);
  },
  showGraph(){ 
    const miniGraph = el('#miniGraph');
    if(miniGraph) miniGraph.scrollIntoView({behavior:'smooth'}); 
  },

  showAIAssistant(){
    if (typeof AdvancedUI !== 'undefined') {
      AdvancedUI.showAIAssistant();
    }
  },

  showAnalyticsDashboard(){
    if (typeof AdvancedUI !== 'undefined') {
      AdvancedUI.showAnalyticsDashboard();
    }
  },
  
  showAdvancedSearch(){
    if (typeof AdvancedSearch !== 'undefined') {
      AdvancedSearch.showAdvancedSearch();
    }
  },
  
  showUserDashboard(){
    if (typeof Monetization !== 'undefined') {
      Monetization.showUserDashboard();
    }
  },
  
  showWorkspaceAnalytics(){
    if (typeof Workspace !== 'undefined') {
      Workspace.showWorkspaceAnalytics();
    }
  },
  
  exportToFormat(format){
    if (typeof AdvancedEditor !== 'undefined') {
      AdvancedEditor.exportNote(format);
    }
  },
  
  importContent(){
    if (typeof AdvancedEditor !== 'undefined') {
      AdvancedEditor.importContent();
    }
  },
  
  showBackupOptions(){
    if (typeof DataManagement !== 'undefined') {
      DataManagement.showBackupModal();
    }
  },
  
  showSyncOptions(){
    if (typeof DataManagement !== 'undefined') {
      DataManagement.showSyncModal();
    }
  },
  
  showPluginManager(){
    if (typeof PluginSystem !== 'undefined') {
      PluginSystem.showPluginManager();
    }
  },
  
  showThemeManager(){
    if (typeof Themes !== 'undefined') {
      Themes.showThemeManager();
    }
  },
  
  showWorkspaceManager(){
    if (typeof Workspace !== 'undefined') {
      Workspace.showWorkspaceSettings();
    }
  }
  async export(){
    const data = await Store.export();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {href:url, download:`mahart-notes-${Date.now()}.json`});
    a.click(); URL.revokeObjectURL(url);
    if(typeof Analytics !== 'undefined') Analytics.log('export', {count:data.notes.length});
  },
  async import(file){
    if(!file) return;
    try {
      const text = await file.text();
      await Store.import(text);
      await this.refresh();
      toast('Imported');
      if(typeof Analytics !== 'undefined') Analytics.log('import', {});
    } catch (error) {
      console.error('Import failed:', error);
      toast('Import failed');
    }
  },
  eventsPush(e){
    const box = el('#eventLog');
    if (!box) return;
    const line = `[${new Date().toLocaleTimeString()}] ${e.evt}${e.data?.id?' #'+e.data.id:''}`;
    const pre = document.createElement('div'); pre.textContent=line; box.prepend(pre);
    const kids = box.children; if(kids.length>120) kids[kids.length-1].remove();
  },

  // Enhanced tag system methods
  initTagSystem(){
    setTimeout(() => {
      if(typeof TagUI !== 'undefined' && typeof TagUI.createTagInput === 'function') {
        this.tagInput = TagUI.createTagInput('#enhanced-tags-input', {
          placeholder: 'Add tags... (start typing for suggestions)',
          onTagsChange: (tags) => {
            const dirty = el('#dirty');
            if(dirty) dirty.style.display = 'inline-block';
          },
          initialTags: []
        });
      }
    }, 200);
  },

  async toggleTagStats(){
    const statsPanel = el('#tagStats');
    const tagStatsBtn = el('#tagStatsBtn');
    if (!statsPanel || !tagStatsBtn) return;
    
    const isVisible = statsPanel.style.display !== 'none';
    
    if(isVisible) {
      statsPanel.style.display = 'none';
      tagStatsBtn.textContent = 'Stats';
    } else {
      if(typeof TagManager !== 'undefined' && typeof TagManager.getTagStats === 'function') {
        const stats = await TagManager.getTagStats();
        this.renderTagStats(stats);
      }
      statsPanel.style.display = 'block';
      tagStatsBtn.textContent = 'Hide';
    }
  },

  async renderTagStats(stats){
    const container = el('#tagStats');
    if (!container) return;
    const entries = Object.entries(stats).slice(0, 10); // Top 10 tags
    
    container.innerHTML = entries.map(([tag, data]) => `
      <div class="tag-stat-item">
        <span style="color: ${data.color}">#${tag}</span>
        <div class="tag-stat-bar">
          <div class="tag-stat-fill" style="width: ${data.percentage}%; background-color: ${data.color}"></div>
        </div>
        <span class="small">${data.count}</span>
      </div>
    `).join('');
  },

  toggleBulkMode(){
    this.state.bulkMode = !this.state.bulkMode;
    const opsPanel = el('#bulkTagOps');
    const button = el('#bulkTagBtn');
    if (!opsPanel || !button) return;
    
    if(this.state.bulkMode) {
      button.textContent = 'Exit';
      button.style.backgroundColor = '#dc2626';
      this.renderBulkOperations();
      opsPanel.classList.add('active');
    } else {
      button.textContent = 'Bulk';
      button.style.backgroundColor = '';
      opsPanel.classList.remove('active');
      this.state.selectedNotes.clear();
      this.renderNoteSelection();
    }
  },

  renderBulkOperations(){
    const container = el('#bulkTagOps');
    if (!container) return;
    container.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>Bulk Tag Operations</strong>
        <span class="badge" id="selectedCount">0 selected</span>
      </div>
      <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
        <button class="bulk-btn" onclick="UI.bulkSelectAll()">Select All</button>
        <button class="bulk-btn" onclick="UI.bulkSelectNone()">Select None</button>
        <button class="bulk-btn" onclick="UI.bulkSelectByTag()">By Tag</button>
      </div>
      <div id="bulk-tag-input" style="margin-bottom: 8px;"></div>
      <div style="display: flex; gap: 4px;">
        <button class="bulk-btn" onclick="UI.bulkAddTags()" style="border-color: #10B981;">Add Tags</button>
        <button class="bulk-btn" onclick="UI.bulkRemoveTags()" style="border-color: #EF4444;">Remove Tags</button>
      </div>
    `;

    // Initialize bulk tag input
    if(typeof TagUI !== 'undefined' && typeof TagUI.createTagInput === 'function') {
      this.bulkTagInput = TagUI.createTagInput('#bulk-tag-input', {
        placeholder: 'Tags to add/remove...',
        onTagsChange: () => {},
        initialTags: []
      });
    }

    this.renderNoteSelection();
  },

  renderNoteSelection(){
    // Update note list to show selection checkboxes
    if(this.state.bulkMode) {
      const noteItems = document.querySelectorAll('#noteList .item');
      noteItems.forEach(item => {
        if(!item.querySelector('input[type="checkbox"]')) {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.style.marginRight = '8px';
          checkbox.onchange = () => this.updateSelection();
          item.querySelector('div').prepend(checkbox);
        }
      });
    } else {
      // Remove checkboxes
      document.querySelectorAll('#noteList input[type="checkbox"]').forEach(cb => cb.remove());
    }
    this.updateSelectionCount();
  },

  updateSelection(){
    const checkboxes = document.querySelectorAll('#noteList input[type="checkbox"]');
    this.state.selectedNotes.clear();
    
    checkboxes.forEach((cb, index) => {
      if(cb.checked) {
        // Get note ID from the list item
        const noteItems = document.querySelectorAll('#noteList .item');
        const noteId = noteItems[index]?.dataset?.noteId;
        if(noteId) this.state.selectedNotes.add(noteId);
      }
    });
    
    this.updateSelectionCount();
  },

  updateSelectionCount(){
    const counter = el('#selectedCount');
    if(counter) {
      counter.textContent = `${this.state.selectedNotes.size} selected`;
    }
  },

  async bulkSelectAll(){
    const notes = await Store.allNotes();
    notes.forEach(note => this.state.selectedNotes.add(note.id));
    document.querySelectorAll('#noteList input[type="checkbox"]').forEach(cb => cb.checked = true);
    this.updateSelectionCount();
  },

  bulkSelectNone(){
    this.state.selectedNotes.clear();
    document.querySelectorAll('#noteList input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.updateSelectionCount();
  },

  async bulkSelectByTag(){
    const tagName = prompt('Select notes with tag (without #):');
    if(!tagName) return;
    
    const notes = await Store.allNotes();
    const targetTag = `#${tagName.toLowerCase().replace('#', '')}`;
    
    this.state.selectedNotes.clear();
    notes.forEach(note => {
      if((note.tags || []).includes(targetTag)) {
        this.state.selectedNotes.add(note.id);
      }
    });
    
    // Update checkboxes
    const noteItems = document.querySelectorAll('#noteList .item');
    const checkboxes = document.querySelectorAll('#noteList input[type="checkbox"]');
    
    checkboxes.forEach((cb, index) => {
      const noteId = noteItems[index]?.dataset?.noteId;
      cb.checked = this.state.selectedNotes.has(noteId);
    });
    
    this.updateSelectionCount();
  },

  async bulkAddTags(){
    if(this.state.selectedNotes.size === 0) {
      toast('No notes selected');
      return;
    }
    
    const tagsToAdd = this.bulkTagInput ? this.bulkTagInput.getTags() : [];
    if(tagsToAdd.length === 0) {
      toast('No tags specified');
      return;
    }
    
    if(typeof TagManager !== 'undefined' && typeof TagManager.bulkAddTags === 'function') {
      await TagManager.bulkAddTags(Array.from(this.state.selectedNotes), tagsToAdd);
      await this.refresh();
      toast(`Added ${tagsToAdd.length} tags to ${this.state.selectedNotes.size} notes`);
      if(this.bc) this.bc.postMessage({type:'sync'});
    }
  },

  async bulkRemoveTags(){
    if(this.state.selectedNotes.size === 0) {
      toast('No notes selected');
      return;
    }
    
    const tagsToRemove = this.bulkTagInput ? this.bulkTagInput.getTags() : [];
    if(tagsToRemove.length === 0) {
      toast('No tags specified');
      return;
    }
    
    if(typeof TagManager !== 'undefined' && typeof TagManager.bulkRemoveTags === 'function') {
      await TagManager.bulkRemoveTags(Array.from(this.state.selectedNotes), tagsToRemove);
      await this.refresh();
      toast(`Removed ${tagsToRemove.length} tags from ${this.state.selectedNotes.size} notes`);
      if(this.bc) this.bc.postMessage({type:'sync'});
    }
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ()=> UI.init());
} else {
  // DOM is already loaded
  UI.init();
}