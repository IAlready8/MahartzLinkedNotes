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

      // Initialize new features
      if (typeof PresentationGenerator !== 'undefined') {
        PresentationGenerator.init();
      }
      if (typeof SmartTemplates !== 'undefined') {
        SmartTemplates.init();
      }
      if (typeof LearningMode !== 'undefined') {
        LearningMode.init();
      }
      if (typeof ThemeEditor !== 'undefined') {
        ThemeEditor.init();
      }
      if (typeof CompetitiveImporters !== 'undefined') {
        CompetitiveImporters.init();
      }
      if (typeof DynamicDashboards !== 'undefined') {
        DynamicDashboards.init();
      }
      if (typeof AIKnowledgeDiscovery !== 'undefined') {
        AIKnowledgeDiscovery.init();
      }

      // seed if empty
      const notes = await Store.allNotes();
      if(!notes.length) await this.seed();
      await this.refresh();
      
      // Force initial preview render
      setTimeout(() => {
        const preview = el('#preview');
        if (preview && preview.innerHTML.trim() === '') {
          this.renderPreviewLive();
          console.log('Forced initial preview render');
        }
      }, 500);
      
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
    const a = Note.create({title:'AI Project Showcase', tags:['#ai','#projects','#showcase'], body: `
# AI Project Showcase

Welcome to the ultimate showcase of cutting-edge AI-built projects! This site features innovative applications powered by artificial intelligence.

## Featured Projects

<div class="project-gallery">
  <div class="project-card" data-project="neural-canvas">
    <h3>Neural Canvas</h3>
    <p>An AI-powered creative tool that generates unique digital artwork based on natural language descriptions.</p>
    <div class="project-tags">
      <span class="tag ai-tag">#art</span>
      <span class="tag ai-tag">#generative</span>
      <span class="tag ai-tag">#neural</span>
    </div>
    <button class="btn project-btn" onclick="UI.openNote('seed-neural-canvas')">View Details</button>
  </div>
  
  <div class="project-card" data-project="code-synth">
    <h3>Code Synth</h3>
    <p>An AI assistant that can generate entire applications from simple descriptions.</p>
    <div class="project-tags">
      <span class="tag ai-tag">#development</span>
      <span class="tag ai-tag">#automation</span>
      <span class="tag ai-tag">#coding</span>
    </div>
    <button class="btn project-btn" onclick="UI.openNote('seed-code-synth')">View Details</button>
  </div>
  
  <div class="project-card" data-project="mind-mapper">
    <h3>Mind Mapper</h3>
    <p>An AI that creates visual mind maps from complex topics and ideas.</p>
    <div class="project-tags">
      <span class="tag ai-tag">#visualization</span>
      <span class="tag ai-tag">#learning</span>
      <span class="tag ai-tag">#organization</span>
    </div>
    <button class="btn project-btn" onclick="UI.openNote('seed-mind-mapper')">View Details</button>
  </div>
</div>

Explore these projects and more using the tags and links throughout the site!
`});
    a.id = 'seed-ai-showcase';
    
    const b = Note.create({title:'Neural Canvas Details', tags:['#art','#generative','#neural'], body: `
# Neural Canvas Details

Neural Canvas is an innovative AI-powered creative tool that transforms natural language descriptions into unique digital artwork.

## Key Features
<div class="ai-project-features">

- **Natural Language Interface**: Describe what you want to see in plain English
- **Style Transfer**: Apply artistic styles from famous painters to your creations
- **Real-time Generation**: See your ideas come to life instantly
- **Community Gallery**: Share and explore artwork from other users
</div>

## Technical Highlights
<div class="ai-project-highlights">

- Utilizes state-of-the-art diffusion models
- Custom-trained on a diverse dataset of artistic styles
- Optimized for real-time performance on consumer hardware
</div>

Tags: #ai #art #generative #neural
See [[AI Project Showcase]]
`});
    b.id = 'seed-neural-canvas';
    
    const c = Note.create({title:'Code Synth Details', tags:['#development','#automation','#coding'], body: `
# Code Synth Details

Code Synth is an AI assistant that revolutionizes software development by generating entire applications from simple descriptions.

## Key Features
<div class="ai-project-features">

- **High-level Description Parsing**: Understands complex project requirements
- **Multi-language Support**: Generates code in JavaScript, Python, Java, and more
- **Auto-documentation**: Creates comprehensive documentation for generated code
- **Integration Ready**: Seamlessly integrates with popular development tools
</div>

## Technical Highlights
<div class="ai-project-highlights">

- Built on large language models specifically trained on codebases
- Utilizes advanced prompt engineering for accurate code generation
- Includes security and best practices validation
</div>

Tags: #ai #development #automation #coding
See [[AI Project Showcase]]
`});
    c.id = 'seed-code-synth';
    
    const d = Note.create({title:'Mind Mapper Details', tags:['#visualization','#learning','#organization'], body: `
# Mind Mapper Details

Mind Mapper is an AI that creates visual mind maps from complex topics and ideas, helping users organize and understand information more effectively.

## Key Features
<div class="ai-project-features">

- **Topic Analysis**: Automatically identifies key concepts and relationships
- **Visual Hierarchy**: Creates intuitive visual structures for complex information
- **Interactive Exploration**: Navigate through concepts with dynamic visualizations
- **Export Options**: Share mind maps in various formats
</div>

## Technical Highlights
<div class="ai-project-highlights">

- Employs natural language processing for concept extraction
- Uses graph theory algorithms for optimal layout
- Adapts to different domains and knowledge areas
</div>

Tags: #ai #visualization #learning #organization
See [[AI Project Showcase]]
`});
    d.id = 'seed-mind-mapper';
    
    const e = Note.create({title:'Workflow Guide', tags:['#guide'], body: `
# Workflow Guide

1. Create note (⌘/Ctrl+N)
2. Title, write short atomic idea
3. Link to parent/sibling [[AI Project Showcase]]
4. Add 2+ links to strengthen graph
5. Use #tags for quick slicing and organization
`});
    e.id = 'seed-workflow';
    
    const f = Note.create({title:'Analytics Playbook', tags:['#analytics','#metrics'], body: `
# Analytics Playbook

- Effectiveness: % notes with ≥2 links
- Link density: avg links/note
- Momentum: notes updated/day (14d)
- Usage: create/edit/open events

For AI projects, also track:
- Conceptual coherence in generated content
- User engagement with AI-generated artifacts
- Cross-project knowledge connections

See [[AI Project Showcase]]
`});
    f.id = 'seed-analytics';
    
    const all = [a,b,c,d,e,f];
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
    // More robust element binding with retry mechanism
    const bindElements = () => {
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
      
      // Check if critical elements are available
      if (!newNoteBtn || !saveNoteBtn || !editor) {
        console.log('Critical UI elements not ready, retrying...');
        setTimeout(bindElements, 50);
        return;
      }
      
      // Bind buttons
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
      if (importBtn) importBtn.onclick=()=>{ 
        const fileInput = el('#importFile');
        if(fileInput) {
          fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            await this.import(file);
            fileInput.value = '';
          };
          fileInput.click();
        }
      };
      if (settingsBtn) settingsBtn.onclick=()=>{ const settings = el('#settings'); if(settings) settings.showModal(); };
      if (autoLink) autoLink.onchange=(e)=>this.state.autoLink=e.target.checked;
      if (enableAnalytics) enableAnalytics.onchange=(e)=>{ this.state.analytics=e.target.checked; if(typeof Analytics !== 'undefined') Analytics.enabled=e.target.checked; };
      if (enableBC) enableBC.onchange=(e)=>{ this.state.bc=e.target.checked; this.bc && this.bc.close(); this.bc=this.state.bc? new BroadcastChannel('mahart-notes'):null; };
      if (q) {
        q.addEventListener('input', debounce(()=>{
          this.search(q.value);
          this.updateSearchSuggestions(q.value);
        }, 120));
        q.addEventListener('focus', ()=> this.showSearchSuggestions());
        q.addEventListener('blur', ()=> setTimeout(()=> this.hideSearchSuggestions(), 200));
        q.addEventListener('keydown', (e)=> this.handleSearchKeydown(e));
      }
      if (editor) {
        editor.addEventListener('input', ()=>{
          const dirty = el('#dirty'); 
          if(dirty) dirty.style.display='inline-block'; 
          console.log('Editor input detected, updating preview...');
          this.renderPreviewLive();
        });
        // Also update on paste
        editor.addEventListener('paste', ()=>{
          console.log('Editor paste detected, updating preview...');
          setTimeout(() => this.renderPreviewLive(), 10);
        });
        // Also update on keyup for immediate feedback
        editor.addEventListener('keyup', ()=>{
          this.renderPreviewLive();
        });
        // Force initial render if editor has content
        if (editor.value.trim()) {
          setTimeout(() => {
            console.log('Initial editor content detected, rendering preview...');
            this.renderPreviewLive();
          }, 100);
        }
      }
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
      
      console.log('UI elements bound successfully');
    };
    
    // Start binding process
    bindElements();
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
      this.renderPerformanceStats();
      
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
      
      // Check if note is AI-related
      const isAIRelated = n.tags && n.tags.some(tag => 
        tag.includes('#ai') || tag.includes('#artificial') ||
        tag.includes('#neural') || tag.includes('#machine') ||
        tag.includes('#deep') || tag.includes('#learning') ||
        tag.includes('#generative') || tag.includes('#automation') ||
        tag.includes('#coding') || tag.includes('#development') ||
        tag.includes('#visualization')
      );
      
      div.innerHTML = `<div style="padding:6px 4px;cursor:pointer">
        <div>${n.title||'(untitled)'} ${isAIRelated ? '<span class="badge" style="background: #1b2130; border-color: #2a3147; color: #6ee7ff;">AI</span>' : ''} <span class="badge">#${n.tags?n.tags.length:0} tags</span> <span class="badge">${n.links?n.links.length:0} links</span></div>
        <div class="small">${(n.updatedAt||n.createdAt).slice(0,16).replace('T',' ')}</div>
      </div>`;
      div.onclick = ()=> {
        console.log('Opening note:', n.id);
        this.openNote(n.id);
      };
      box.appendChild(div);
    }
    const noteCount = el('#noteCount');
    if (noteCount) noteCount.textContent = notes.length;
    
    // Auto-open first note if none is currently open and no note is being displayed
    if (!this.state.currentId && sorted.length > 0) {
      const editor = el('#editor');
      const title = el('#title');
      // Only auto-open if editor is truly empty
      if ((!editor || !editor.value.trim()) && (!title || !title.value.trim())) {
        console.log('Auto-opening first note:', sorted[0].id);
        setTimeout(() => this.openNote(sorted[0].id), 200);
      }
    }
    
    // Re-render bulk selection if in bulk mode
    if(this.state.bulkMode) {
      setTimeout(() => this.renderNoteSelection(), 100);
    }
  },
  renderTags(notes){
    const tagBox = el('#tagList');
    if (!tagBox) return;
    tagBox.innerHTML='';
    
    // Add special AI projects filter
    const aiProjectsFilter = document.createElement('span');
    aiProjectsFilter.className = 'tag ai-tag';
    aiProjectsFilter.textContent = '#ai-projects';
    aiProjectsFilter.onclick = () => this.filterTag('#ai-projects');
    tagBox.appendChild(aiProjectsFilter);
    
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
      
      // Special styling for AI-related tags
      if (t.includes('ai') || t.includes('artificial') || 
          t.includes('neural') || t.includes('machine') ||
          t.includes('deep') || t.includes('learning') ||
          t.includes('generative') || t.includes('automation') ||
          t.includes('coding') || t.includes('development') ||
          t.includes('visualization')) {
        span.className = 'tag ai-tag';
      } else {
        span.className = `tag tag-category-${category}`;
        span.style.borderLeftColor = color;
      }
      
      span.textContent = `${t} (${c})`;
      span.onclick=()=> this.filterTag(t);
      tagBox.appendChild(span);
    }
    const tagCount = el('#tagCount');
    if (tagCount) tagCount.textContent = items.length + 1; // +1 for the special filter
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
    if (!editor || !preview) {
      console.log('Preview elements not found:', { editor: !!editor, preview: !!preview });
      return;
    }
    const md = editor.value;
    
    try {
      if (typeof renderMD !== 'undefined') {
        let html = renderMD(md);
        
        // Apply AI project showcase styles
        html = html.replace(/<h1>/g, '<h1 class="ai-project-title">');
        html = html.replace(/<div class="preview">/g, '<div class="preview ai-showcase">');
        
        preview.innerHTML = html;
        console.log('Preview rendered with renderMD and AI showcase styles');
      } else {
        // Fallback rendering
        preview.innerHTML = `<p>${md.replace(/\n/g, '<br>')}</p>`;
        console.log('Preview rendered with fallback');
      }
    } catch (error) {
      console.error('Preview rendering error:', error);
      preview.innerHTML = `<div style="color: var(--bad);">Preview error: ${error.message}</div>`;
    }
  },
  
  renderPreviewLive(){
    const editor = el('#editor');
    const preview = el('#preview');
    if (!editor || !preview) {
      console.log('Live preview elements not found:', { editor: !!editor, preview: !!preview });
      return;
    }
    
    const md = editor.value;
    
    try {
      // Always update preview regardless of content change to ensure consistency
      this.lastPreviewContent = md;
      
      // Clear preview first to ensure clean state
      preview.innerHTML = '';
      
      // Use the live preview function with enhanced features
      if (typeof livePreviewDebounced !== 'undefined') {
        // Call immediately without debounce for more responsive preview
        const rendered = typeof renderMD !== 'undefined' ? renderMD(md) : `<p>${md.replace(/\n/g, '<br>')}</p>`;
        
        // Apply AI project showcase styles after rendering
        let styledHtml = rendered;
        styledHtml = styledHtml.replace(/<h1>/g, '<h1 class="ai-project-title">');
        styledHtml = styledHtml.replace(/<div class="preview">/g, '<div class="preview ai-showcase">');
        
        preview.innerHTML = styledHtml;
        
        // Apply AI showcase class to preview container
        preview.classList.add('ai-showcase');
        
        // Add click handlers to project buttons
        const projectButtons = preview.querySelectorAll('.project-btn');
        projectButtons.forEach(button => {
          // Remove existing event listeners to prevent duplicates
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          newButton.addEventListener('click', (e) => {
            e.preventDefault();
            const onclickAttr = newButton.getAttribute('onclick');
            if (onclickAttr) {
              const noteIdMatch = onclickAttr.match(/'([^']+)'/);
              if (noteIdMatch && noteIdMatch[1]) {
                this.openNote(noteIdMatch[1]);
              }
            }
          });
        });
        
        // Add click handlers for links
        const links = preview.querySelectorAll('a.link');
        links.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const token = decodeURIComponent(link.dataset.wikilink);
            if (typeof UI !== 'undefined' && UI.followWiki) {
              UI.followWiki(token);
            }
          });
        });
        
        console.log('Live preview updated with renderMD');
      } else if (typeof renderMD !== 'undefined') {
        let html = renderMD(md);
        // Apply AI project showcase styles
        html = html.replace(/<h1>/g, '<h1 class="ai-project-title">');
        html = html.replace(/<div class="preview">/g, '<div class="preview ai-showcase">');
        preview.innerHTML = html;
        console.log('Live preview updated with renderMD');
      } else {
        // Fallback rendering with basic markdown
        let html = md
          .replace(/^# (.+)$/gm, '<h1 class="ai-project-title">$1</h1>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\[\[([^\]]+)\]\]/g, '<a class="link" href="#" onclick="UI.followWiki(\'$1\')">$1</a>')
          .replace(/(^|\s)(#[a-z0-9_\-]+)/gi, '$1<span class="tag" style="color: var(--acc); background: var(--acc)20; padding: 2px 6px; border-radius: 12px; border: 1px solid var(--acc);">$2</span>')
          .replace(/\n/g, '<br>');
        
        preview.innerHTML = `<div class="preview ai-showcase">${html}</div>`;
        console.log('Live preview updated with fallback markdown');
      }
    } catch (error) {
      console.error('Live preview rendering error:', error);
      preview.innerHTML = `<div style="color: var(--bad);">Live preview error: ${error.message}</div>`;
    }
    
    // Update word count and other stats in real-time
    this.updateEditorStats(md);
  },
  
  updateEditorStats(content){
    // Real-time editor statistics
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const lines = content.split('\n').length;
    const tags = (content.match(/#[a-z0-9_\-]+/gi) || []).length;
    const links = (content.match(/\[\[([^\]]+)\]\]/g) || []).length;
    
    // Update status in the UI if there's a status area
    const statusArea = el('#editorStatus');
    if (statusArea) {
      statusArea.innerHTML = `
        <span>Words: ${words}</span> | 
        <span>Chars: ${chars}</span> | 
        <span>Lines: ${lines}</span> | 
        <span>Tags: ${tags}</span> | 
        <span>Links: ${links}</span>
      `;
    }
    
    // Store stats for analytics
    this.currentNoteStats = { words, chars, lines, tags, links };
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
    
    // Add AI project statistics
    this.renderAIStats(notes);
    
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

  renderAIStats(notes) {
    // Count AI-related notes
    const aiNotes = notes.filter(note => 
      note.tags && note.tags.some(tag => 
        tag.includes('#ai') || tag.includes('#artificial')
      )
    );
    
    // Count AI-related tags
    const aiTags = new Set();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (tag.includes('#ai') || tag.includes('#artificial') || 
              tag.includes('#neural') || tag.includes('#machine') ||
              tag.includes('#deep') || tag.includes('#learning')) {
            aiTags.add(tag);
          }
        });
      }
    });
    
    // Find the project showcase note
    const showcaseNote = notes.find(note => note.title === 'AI Project Showcase');
    
    // Create or update AI stats panel
    let aiStatsPanel = el('#aiStatsPanel');
    if (!aiStatsPanel) {
      aiStatsPanel = document.createElement('div');
      aiStatsPanel.id = 'aiStatsPanel';
      aiStatsPanel.className = 'panel small';
      aiStatsPanel.innerHTML = `
        <strong>AI Project Statistics</strong>
        <div id="aiStatsContent"></div>
      `;
      
      // Insert after the KPI panel
      const kpiPanel = el('#kpiPanel');
      if (kpiPanel && kpiPanel.parentNode) {
        kpiPanel.parentNode.insertBefore(aiStatsPanel, kpiPanel.nextSibling);
      } else {
        // Fallback: append to right panel
        const rightPanel = el('.right');
        if (rightPanel) {
          rightPanel.appendChild(aiStatsPanel);
        }
      }
    }
    
    // Update stats content
    const aiStatsContent = el('#aiStatsContent');
    if (aiStatsContent) {
      aiStatsContent.innerHTML = `
        <div class="code" style="font-size: 12px;">
          <div>AI Notes: <span style="color: #6ee7ff;">${aiNotes.length}</span></div>
          <div>AI Tags: <span style="color: #9a7cff;">${aiTags.size}</span></div>
          ${showcaseNote ? `<div>Showcase Links: <span style="color: #ffd166;">${showcaseNote.links ? showcaseNote.links.length : 0}</span></div>` : ''}
        </div>
      `;
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
    if (editor) {
      editor.value = n.body||'';
      // Force initial preview render
      setTimeout(() => {
        this.renderPreviewLive();
        this.updateEditorStats(n.body||'');
      }, 100);
    }
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
    
    // Force preview update for new note
    setTimeout(() => {
      this.renderPreviewLive();
    }, 200);
    
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
    // Extract tags from content and merge with tag input
    const contentTags = editor ? [...new Set((editor.value.match(/#[a-z0-9_\-]+/gi) || []).map(t => t.toLowerCase()))] : [];
    const inputTags = this.tagInput ? this.tagInput.getTags() : [];
    n.tags = [...new Set([...contentTags, ...inputTags])];
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
    
    // Update preview to reflect saved content
    setTimeout(() => {
      this.renderPreviewLive();
    }, 100);
    
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
    if (typeof Search !== 'undefined' && Search.clearFilters) {
      Search.clearFilters();
    }
    
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
    if (t === '#ai-projects') {
      // Special filter for all AI projects
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
      this.renderList(aiNotes);
    } else {
      this.renderList(notes.filter(n=> (n.tags||[]).includes(t)));
    }
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
  },
  
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
  },
  
  // Enhanced search suggestions
  updateSearchSuggestions(query) {
    const container = el('#searchSuggestions');
    if (!container || !query || query.length < 2) {
      this.hideSearchSuggestions();
      return;
    }
    
    if (typeof Search !== 'undefined' && typeof Search.getSuggestions === 'function') {
      const suggestions = Search.getSuggestions(query, 8);
      this.renderSearchSuggestions(suggestions);
    }
  },
  
  renderSearchSuggestions(suggestions) {
    const container = el('#searchSuggestions');
    if (!container) return;
    
    if (suggestions.length === 0) {
      this.hideSearchSuggestions();
      return;
    }
    
    container.innerHTML = suggestions.map((suggestion, index) => {
      const typeClass = suggestion.type;
      const countText = suggestion.count ? ` (${suggestion.count})` : '';
      
      return `
        <div class="search-suggestion-item ${index === 0 ? 'selected' : ''}" 
             data-index="${index}" 
             data-type="${suggestion.type}"
             data-text="${suggestion.text}"
             data-id="${suggestion.id || ''}">
          <span class="suggestion-text">${suggestion.text}</span>
          <div>
            <span class="suggestion-type ${typeClass}">${suggestion.type}</span>
            <span class="suggestion-count">${countText}</span>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    container.querySelectorAll('.search-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectSuggestion(item);
      });
    });
    
    this.showSearchSuggestions();
    this.selectedSuggestionIndex = 0;
  },
  
  showSearchSuggestions() {
    const container = el('#searchSuggestions');
    if (container) {
      container.style.display = 'block';
    }
  },
  
  hideSearchSuggestions() {
    const container = el('#searchSuggestions');
    if (container) {
      container.style.display = 'none';
    }
  },
  
  handleSearchKeydown(e) {
    const container = el('#searchSuggestions');
    if (!container || container.style.display === 'none') return;
    
    const items = container.querySelectorAll('.search-suggestion-item');
    if (items.length === 0) return;
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, items.length - 1);
        this.updateSelectedSuggestion(items);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, 0);
        this.updateSelectedSuggestion(items);
        break;
        
      case 'Enter':
        e.preventDefault();
        const selectedItem = items[this.selectedSuggestionIndex];
        if (selectedItem) {
          this.selectSuggestion(selectedItem);
        }
        break;
        
      case 'Escape':
        this.hideSearchSuggestions();
        break;
    }
  },
  
  updateSelectedSuggestion(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedSuggestionIndex);
    });
  },
  
  selectSuggestion(item) {
    const type = item.dataset.type;
    const text = item.dataset.text;
    const id = item.dataset.id;
    const q = el('#q');
    
    if (type === 'title' && id) {
      // Open the note directly
      this.openNote(id);
      if (q) q.value = '';
    } else if (type === 'tag') {
      // Set search to this tag
      if (q) q.value = `tag:${text}`;
      this.search(q.value);
    } else {
      // Set search to this text
      if (q) q.value = text;
      this.search(q.value);
    }
    
    this.hideSearchSuggestions();
  },
  
  // Performance monitoring for right panel
  async renderPerformanceStats() {
    const perfBox = el('#perfBox');
    if (!perfBox) return;
    
    const dbHealth = Store.getDbHealth ? await Store.getDbHealth() : null;
    const searchStats = Search.getSearchStats ? Search.getSearchStats() : null;
    
    if (dbHealth && searchStats) {
      perfBox.innerHTML = `
        <div class="performance-panel">
          <div class="performance-header">
            <strong>System Performance</strong>
            <button onclick="UI.optimizeSystem()" class="bulk-btn" style="font-size: 10px;">Optimize</button>
          </div>
          <div class="performance-stats">
            <div class="performance-stat">
              <span class="stat-label">Notes</span>
              <span class="stat-value">${dbHealth.noteCount}</span>
            </div>
            <div class="performance-stat">
              <span class="stat-label">Storage</span>
              <span class="stat-value">${dbHealth.estimatedSize}KB</span>
            </div>
            <div class="performance-stat">
              <span class="stat-label">Index</span>
              <span class="stat-value">${searchStats.indexSize}</span>
            </div>
            <div class="performance-stat">
              <span class="stat-label">Cache</span>
              <span class="stat-value">${searchStats.cacheSize}</span>
            </div>
            <div class="performance-stat">
              <span class="stat-label">Backups</span>
              <span class="stat-value">${dbHealth.backupCount}</span>
            </div>
            <div class="performance-stat">
              <span class="stat-label">Versions</span>
              <span class="stat-value">${dbHealth.versionCount}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Fallback display
      perfBox.innerHTML = `
        <div class="performance-panel">
          <div class="performance-header">
            <strong>Performance</strong>
          </div>
          <div style="color: var(--muted); font-size: 11px;">
            System monitoring active
          </div>
        </div>
      `;
    }
  },
  
  async optimizeSystem() {
    try {
      toast('Optimizing system...');
      
      if (Store.optimizeDb) {
        const result = await Store.optimizeDb();
        if (result.success) {
          toast(`Optimization complete! Cleaned ${result.deletedVersions} old versions`);
        } else {
          toast('Optimization failed');
        }
      }
      
      // Clear render caches
      if (typeof markdownCache !== 'undefined') {
        markdownCache.clear();
      }
      
      // Refresh performance display
      this.renderPerformanceStats();
      
    } catch (error) {
      console.error('System optimization failed:', error);
      toast('Optimization failed');
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