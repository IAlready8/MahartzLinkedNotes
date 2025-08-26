/* Premium Features Enhancement */

// Enhanced UI object with premium features
Object.assign(UI, {
  
  // Enhanced preview rendering with better markdown support
  renderPreviewLive() {
    const editor = el('#editor');
    const preview = el('#preview');
    if (!editor || !preview) return;
    
    const md = editor.value;
    
    // Update stats
    this.updateEditorStats(md);
    
    if (!md.trim()) {
      preview.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <i class="fas fa-file-alt text-2xl text-blue-400"></i>
          </div>
          <p class="text-gray-400 text-lg">Start writing to see live preview</p>
          <p class="text-gray-500 text-sm mt-2">Your markdown will be rendered here in real-time</p>
        </div>
      `;
      return;
    }
    
    if(typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined'){
      // Enhanced markdown rendering
      const rendered = marked.parse(md);
      const sanitized = DOMPurify.sanitize(rendered);
      
      // Process wiki links and tags
      const enhanced = this.enhanceMarkdownContent(sanitized);
      preview.innerHTML = enhanced;
      
      // Add syntax highlighting if available
      if(typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(preview);
      }
    } else {
      preview.textContent = md;
    }
  },
  
  // Enhance markdown content with wiki links and tags
  enhanceMarkdownContent(html) {
    // Process wiki links [[Note Title]] and [[ID:xxxx]]
    html = html.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
      if(content.startsWith('ID:')) {
        const id = content.substring(3);
        return `<a href="#" class="wiki-link" data-note-id="${id}" onclick="UI.openWikiLink('${id}')">${content}</a>`;
      } else {
        return `<a href="#" class="wiki-link" data-note-title="${content}" onclick="UI.openWikiLinkByTitle('${content}')">${content}</a>`;
      }
    });
    
    // Process tags #tag
    html = html.replace(/#([a-z0-9_\-]+)/gi, (match, tag) => {
      return `<span class="tag" data-tag="${tag}" onclick="UI.filterByTag('${tag}')">${match}</span>`;
    });
    
    return html;
  },
  
  // Update editor statistics
  updateEditorStats(content) {
    const wordCount = this.countWords(content);
    const charCount = content.length;
    const readingTime = this.calculateReadingTime(wordCount);
    
    const wordCountEl = el('#wordCount');
    const charCountEl = el('#charCount');
    const readingTimeEl = el('#readingTime');
    
    if(wordCountEl) wordCountEl.textContent = wordCount;
    if(charCountEl) charCountEl.textContent = charCount.toLocaleString();
    if(readingTimeEl) readingTimeEl.textContent = readingTime;
  },
  
  // Count words in content
  countWords(content) {
    if(!content.trim()) return 0;
    // Remove markdown syntax for more accurate count
    const cleanContent = content
      .replace(/#{1,6}\s/g, '') // headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/```[\s\S]*?```/g, '') // code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/\[\[([^\]]+)\]\]/g, '$1') // wiki links
      .trim();
    
    return cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  },
  
  // Calculate reading time (average 200 words per minute)
  calculateReadingTime(wordCount) {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes === 1 ? '1 min' : `${minutes} min`;
  },
  
  // Handle wiki link clicks
  async openWikiLink(noteId) {
    const note = await Store.get(noteId);
    if(note) {
      await this.openNote(noteId);
    } else {
      toast('Note not found', 'error');
    }
  },
  
  // Handle wiki link clicks by title
  async openWikiLinkByTitle(title) {
    const notes = await Store.allNotes();
    const note = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
    
    if(note) {
      await this.openNote(note.id);
    } else {
      // Create new note with this title
      const newNote = Note.create({ title, body: '', tags: [] });
      await Store.upsert(newNote);
      await this.refreshHomePage();
      await this.openNote(newNote.id);
      toast(`Created new note: ${title}`);
    }
  },
  
  // Filter notes by tag
  async filterByTag(tag) {
    // This could open the tags page with this tag filtered
    window.location.hash = '#/tags';
    // Implementation would filter by the specific tag
    toast(`Filtering by ${tag}`);
  },
  
  // Enhanced note rendering in list
  renderNoteList(notes) {
    const box = el('#noteList');
    if (!box) return;

    const sorted = [...notes].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    box.innerHTML = '';
    
    for (const n of sorted) {
      const div = document.createElement('div');
      const isActive = n.id === this.state.currentId;
      
      // Enhanced note preview
      const preview = n.body.slice(0, 80).replace(/[#*`\[\]]/g, '');
      const tagCount = n.tags.length;
      const linkCount = (n.links || []).length;
      
      div.className = `note-item ${isActive ? 'bg-blue-600' : ''}`;
      div.innerHTML = `
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-white truncate flex-1">${n.title || '(untitled)'}</h4>
          <div class="w-3 h-3 rounded-full ml-2 flex-shrink-0" style="background: ${n.color || '#6B7280'};"></div>
        </div>
        ${preview ? `<p class="text-sm text-gray-400 mb-2 line-clamp-2">${preview}${n.body.length > 80 ? '...' : ''}</p>` : ''}
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">${(n.updatedAt || n.createdAt).slice(0, 10)}</span>
          <div class="flex items-center gap-2 text-gray-500">
            ${tagCount > 0 ? `<span><i class="fas fa-tag"></i> ${tagCount}</span>` : ''}
            ${linkCount > 0 ? `<span><i class="fas fa-link"></i> ${linkCount}</span>` : ''}
          </div>
        </div>
      `;
      
      div.onclick = () => this.openNote(n.id);
      box.appendChild(div);
    }
    
    const noteCount = el('#noteCount');
    if(noteCount) noteCount.textContent = `${notes.length} notes`;
    
    // Update sidebar counter
    this.updateNoteCounter();
  },
  
  // Enhanced editor toolbar functionality
  initEditorToolbar() {
    const tools = els('.editor-tool');
    tools.forEach(tool => {
      const icon = tool.querySelector('i');
      if(!icon) return;
      
      if(icon.classList.contains('fa-bold')) {
        tool.onclick = () => this.insertMarkdown('**', '**', 'bold text');
      } else if(icon.classList.contains('fa-italic')) {
        tool.onclick = () => this.insertMarkdown('*', '*', 'italic text');
      } else if(icon.classList.contains('fa-link')) {
        tool.onclick = () => this.insertMarkdown('[', '](url)', 'link text');
      } else if(icon.classList.contains('fa-code')) {
        tool.onclick = () => this.insertMarkdown('`', '`', 'code');
      }
    });
  },
  
  // Insert markdown syntax at cursor position
  insertMarkdown(before, after, placeholder) {
    const editor = el('#editor');
    if(!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const replacement = selectedText || placeholder;
    
    const newText = before + replacement + after;
    const newValue = editor.value.substring(0, start) + newText + editor.value.substring(end);
    
    editor.value = newValue;
    
    // Set cursor position
    const newCursorPos = selectedText ? 
      start + newText.length : 
      start + before.length + placeholder.length;
    
    editor.setSelectionRange(newCursorPos, newCursorPos);
    editor.focus();
    
    // Trigger input event for live preview
    editor.dispatchEvent(new Event('input'));
  },
  
  // Enhanced open note with better UX
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
    
    if(titleEl) {
      titleEl.value = n.title || '';
      // Add smooth focus animation
      titleEl.style.transform = 'scale(1.02)';
      setTimeout(() => titleEl.style.transform = 'scale(1)', 200);
    }
    
    if(editorEl) {
      editorEl.value = n.body || '';
      // Add typing animation effect
      if(n.body) {
        editorEl.style.opacity = '0.7';
        setTimeout(() => editorEl.style.opacity = '1', 100);
      }
    }
    
    if(colorButton) {
      const color = n.color || '#6B7280';
      colorButton.style.background = `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;
    }
    
    const dirty = el('#dirty');
    if(dirty) dirty.classList.add('hidden');
    
    this.renderPreviewLive();
    this.renderNoteList(await Store.allNotes());
    
    // Add subtle success feedback
    this.showNoteOpenedFeedback(n.title);
  },
  
  // Show subtle feedback when note is opened
  showNoteOpenedFeedback(title) {
    const truncatedTitle = title.length > 30 ? title.slice(0, 30) + '...' : title;
    // Could show a subtle indicator or animation
    console.log(`Opened: ${truncatedTitle}`);
  },
  
  // Darken color utility
  darkenColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },
  
  // Enhanced home page events
  bindEnhancedHomePageEvents() {
    // Call original binding first
    if(this.bindHomePageEvents) {
      this.bindHomePageEvents();
    }
    
    // Add editor toolbar
    this.initEditorToolbar();
    
    // Enhanced editor input handling
    const editor = el('#editor');
    if(editor) {
      editor.addEventListener('input', debounce(() => {
        const dirty = el('#dirty');
        if(dirty) dirty.classList.remove('hidden');
        this.renderPreviewLive();
      }, 150)); // Faster response for premium feel
      
      // Add auto-resize functionality
      editor.addEventListener('input', () => {
        this.adjustEditorHeight();
      });
    }
    
    // Enhanced title input
    const title = el('#title');
    if(title) {
      title.addEventListener('input', () => { 
        const dirty = el('#dirty');
        if(dirty) dirty.classList.remove('hidden');
      });
      
      // Auto-focus title when empty
      title.addEventListener('focus', () => {
        title.style.transform = 'scale(1.02)';
      });
      
      title.addEventListener('blur', () => {
        title.style.transform = 'scale(1)';
      });
    }
  },
  
  // Auto-adjust editor height (if needed)
  adjustEditorHeight() {
    const editor = el('#editor');
    if(editor && editor.scrollHeight > editor.clientHeight) {
      // Could implement auto-height adjustment here
    }
  },
  
  // Enhanced save with better feedback
  async save() {
    const id = this.state.currentId;
    if (!id) return;

    const saveBtn = el('#saveNoteInline');
    if(saveBtn) {
      // Add saving state
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
      saveBtn.disabled = true;
    }

    try {
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
      
      // Enhanced success feedback
      toast('Note saved successfully', 'success');
      
      await this.refreshHomePage();
      if (this.bc) this.bc.postMessage({ type: 'sync' });
      
    } catch(error) {
      console.error('Save failed:', error);
      toast('Failed to save note', 'error');
    } finally {
      // Restore save button
      if(saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save';
        saveBtn.disabled = false;
      }
    }
  }
});

// Override some methods to use enhanced versions
const originalBindHomePageEvents = UI.bindHomePageEvents;
UI.bindHomePageEvents = function() {
  this.bindEnhancedHomePageEvents();
};

// Initialize premium features on page load
document.addEventListener('DOMContentLoaded', () => {
  // Add premium classes to body
  document.body.classList.add('premium-theme');
  
  // Initialize enhanced features when on home page
  if(window.location.hash === '#/' || window.location.hash === '') {
    setTimeout(() => {
      if(typeof UI !== 'undefined' && UI.initEditorToolbar) {
        UI.initEditorToolbar();
      }
    }, 500);
  }
});

// Add premium keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const isCmd = e.metaKey || e.ctrlKey;
  
  if(isCmd && e.key === 'b' && window.location.hash === '#/') {
    e.preventDefault();
    UI.insertMarkdown('**', '**', 'bold text');
  }
  
  if(isCmd && e.key === 'i' && window.location.hash === '#/') {
    e.preventDefault();
    UI.insertMarkdown('*', '*', 'italic text');
  }
  
  if(isCmd && e.key === 'l' && window.location.hash === '#/') {
    e.preventDefault();
    UI.insertMarkdown('[', '](url)', 'link text');
  }
  
  if(isCmd && e.key === '`' && window.location.hash === '#/') {
    e.preventDefault();
    UI.insertMarkdown('`', '`', 'code');
  }
});

console.log('Premium features loaded');
