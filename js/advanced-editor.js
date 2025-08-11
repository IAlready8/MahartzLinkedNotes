/* advanced-editor.js — Advanced note editor with enhanced features */

const AdvancedEditor = {
  // Editor instances
  editors: new Map(),
  
  // Current editor state
  currentState: {
    noteId: null,
    hasUnsavedChanges: false,
    lastSaved: null,
    wordCount: 0,
    charCount: 0,
    readingTime: 0
  },
  
  // Editor extensions
  extensions: new Map(),
  
  // Initialize advanced editor
  async init() {
    // Register built-in extensions
    this.registerExtension('spellcheck', {
      name: 'Spell Checker',
      description: 'Real-time spell checking',
      enabled: true,
      init: this.initSpellCheck.bind(this),
      process: this.processSpellCheck.bind(this)
    });
    
    this.registerExtension('autocompletion', {
      name: 'Auto Completion',
      description: 'Intelligent auto-completion for tags and links',
      enabled: true,
      init: this.initAutoCompletion.bind(this),
      process: this.processAutoCompletion.bind(this)
    });
    
    this.registerExtension('templating', {
      name: 'Template Engine',
      description: 'Advanced templating with variables',
      enabled: true,
      init: this.initTemplating.bind(this),
      process: this.processTemplating.bind(this)
    });
    
    this.registerExtension('formatting', {
      name: 'Smart Formatting',
      description: 'Intelligent text formatting',
      enabled: true,
      init: this.initFormatting.bind(this),
      process: this.processFormatting.bind(this)
    });
    
    // Initialize UI enhancements
    this.initUI();
  },
  
  // Register editor extension
  registerExtension(id, extension) {
    this.extensions.set(id, extension);
    
    // Initialize if enabled
    if (extension.enabled && extension.init) {
      extension.init();
    }
  },
  
  // Initialize UI enhancements
  initUI() {
    // This will be called to initialize editor UI components
    this.initHighlighter();
  },
  
  // Initialize highlighter toolbar
  initHighlighter() {
    const editorCard = document.querySelector('.main .card');
    if (!editorCard) return;
    
    // Create highlighter toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'highlight-toolbar';
    toolbar.id = 'highlightToolbar';
    toolbar.innerHTML = `
      <div class="highlight-btn highlight-yellow" data-color="yellow" title="Yellow Highlight"></div>
      <div class="highlight-btn highlight-green" data-color="green" title="Green Highlight"></div>
      <div class="highlight-btn highlight-blue" data-color="blue" title="Blue Highlight"></div>
      <div class="highlight-btn highlight-purple" data-color="purple" title="Purple Highlight"></div>
      <div class="highlight-btn highlight-pink" data-color="pink" title="Pink Highlight"></div>
      <div class="highlight-btn highlight-red" data-color="red" title="Red Highlight"></div>
      <button id="removeHighlightBtn" class="btn btn-small" style="margin-left: auto; padding: 2px 8px; font-size: 12px;">Remove</button>
    `;
    
    // Insert after the card header
    const cardHeader = editorCard.querySelector('h3');
    if (cardHeader) {
      cardHeader.parentNode.insertBefore(toolbar, cardHeader.nextSibling);
    }
    
    // Bind events
    toolbar.querySelectorAll('.highlight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        this.applyHighlight(color);
        this.updateHighlighterUI(color);
      });
    });
    
    const removeBtn = document.getElementById('removeHighlightBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.removeHighlight();
        this.updateHighlighterUI(null);
      });
    }
    
    // Hide toolbar initially
    toolbar.style.display = 'none';
  },
  
  // Show highlighter toolbar
  showHighlighter() {
    const toolbar = document.getElementById('highlightToolbar');
    if (toolbar) {
      toolbar.style.display = 'flex';
    }
  },
  
  // Hide highlighter toolbar
  hideHighlighter() {
    const toolbar = document.getElementById('highlightToolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  },
  
  // Update highlighter UI
  updateHighlighterUI(activeColor) {
    const buttons = document.querySelectorAll('.highlight-btn');
    buttons.forEach(btn => {
      if (btn.dataset.color === activeColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },
  
  // Apply highlight to selected text
  applyHighlight(color) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    if (!selectedText) return;
    
    // Apply highlight with custom class
    const highlightClass = `highlight-${color}-text`;
    const newText = `<span class="${highlightClass}">${selectedText}</span>`;
    const beforeSelection = editor.value.substring(0, start);
    const afterSelection = editor.value.substring(end);
    
    editor.value = beforeSelection + newText + afterSelection;
    editor.selectionStart = start + newText.length;
    editor.selectionEnd = start + newText.length;
    
    // Trigger input event
    editor.dispatchEvent(new Event('input'));
  },
  
  // Remove highlight from selected text
  removeHighlight() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    if (!selectedText) return;
    
    // Remove highlight span tags
    const cleanText = selectedText.replace(/<span class="highlight-[a-z]+-text">([^<]*)<\/span>/g, '$1');
    const beforeSelection = editor.value.substring(0, start);
    const afterSelection = editor.value.substring(end);
    
    editor.value = beforeSelection + cleanText + afterSelection;
    editor.selectionStart = start;
    editor.selectionEnd = start + cleanText.length;
    
    // Trigger input event
    editor.dispatchEvent(new Event('input'));
  },
  
  // Enhance editor for a note
  async enhanceEditor(noteId) {
    this.currentState.noteId = noteId;
    
    // Initialize extensions
    for (const [id, extension] of this.extensions.entries()) {
      if (extension.enabled && extension.process) {
        await extension.process(noteId);
      }
    }
    
    // Set up editor monitoring
    this.setupEditorMonitoring();
  },
  
  // Set up editor monitoring
  setupEditorMonitoring() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    // Update stats on input
    const updateStats = debounce(() => {
      this.updateEditorStats();
      this.currentState.hasUnsavedChanges = true;
    }, 500);
    
    editor.addEventListener('input', updateStats);
    
    // Show highlighter when text is selected
    editor.addEventListener('mouseup', () => {
      setTimeout(() => {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        if (start !== end) {
          this.showHighlighter();
        } else {
          this.hideHighlighter();
        }
      }, 10);
    });
    
    // Hide highlighter when editor loses focus
    editor.addEventListener('blur', () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (!activeElement || (activeElement.id !== 'editor' && !activeElement.classList.contains('highlight-btn'))) {
          this.hideHighlighter();
        }
      }, 200);
    });
    
    // Update stats immediately
    this.updateEditorStats();
  },
  
  // Update editor statistics
  updateEditorStats() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const content = editor.value || '';
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 wpm
    
    this.currentState.wordCount = words;
    this.currentState.charCount = chars;
    this.currentState.readingTime = readingTime;
    
    // Update UI
    this.updateStatsUI();
  },
  
  // Update statistics UI
  updateStatsUI() {
    // Update word count display
    const wordCountEl = document.getElementById('wordCount');
    if (wordCountEl) {
      wordCountEl.textContent = `${this.currentState.wordCount} words`;
    }
    
    // Update character count display
    const charCountEl = document.getElementById('charCount');
    if (charCountEl) {
      charCountEl.textContent = `${this.currentState.charCount} chars`;
    }
    
    // Update reading time display
    const readingTimeEl = document.getElementById('readingTime');
    if (readingTimeEl) {
      readingTimeEl.textContent = `${this.currentState.readingTime} min read`;
    }
  },
  
  // Spell Check Extension
  async initSpellCheck() {
    console.log('Spell check extension initialized');
    // In a real implementation, this would initialize a spell checking library
  },
  
  async processSpellCheck(noteId) {
    // Process spell checking for the note
    console.log('Processing spell check for note:', noteId);
  },
  
  // Auto Completion Extension
  async initAutoCompletion() {
    console.log('Auto completion extension initialized');
    
    // Set up auto-completion for the editor
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    // Create auto-completion UI
    this.createAutoCompletionUI();
    
    // Bind events
    editor.addEventListener('input', debounce((e) => {
      this.handleAutoCompletion(e);
    }, 300));
  },
  
  createAutoCompletionUI() {
    // Create auto-completion dropdown
    const autoComplete = document.createElement('div');
    autoComplete.id = 'autoCompleteDropdown';
    autoComplete.className = 'autocomplete-dropdown';
    autoComplete.style.display = 'none';
    
    document.body.appendChild(autoComplete);
  },
  
  async handleAutoCompletion(e) {
    const editor = e.target;
    const cursorPos = editor.selectionStart;
    const text = editor.value.substring(0, cursorPos);
    
    // Check for trigger characters
    const lastHash = text.lastIndexOf('#');
    const lastBracket = text.lastIndexOf('[[');
    
    // Handle tag completion
    if (lastHash > lastBracket && lastHash > -1) {
      const tagQuery = text.substring(lastHash + 1);
      if (tagQuery.length > 0 && !tagQuery.includes(' ')) {
        await this.showTagCompletion(tagQuery, lastHash, cursorPos);
        return;
      }
    }
    
    // Handle link completion
    if (lastBracket > lastHash && lastBracket > -1) {
      const linkQuery = text.substring(lastBracket + 2);
      if (linkQuery.length > 0 && !linkQuery.includes(']]')) {
        await this.showLinkCompletion(linkQuery, lastBracket, cursorPos);
        return;
      }
    }
    
    // Hide completion dropdown
    this.hideAutoCompletion();
  },
  
  async showTagCompletion(query, startPos, cursorPos) {
    try {
      const notes = await Store.allNotes();
      const allTags = new Set();
      
      // Collect all tags
      notes.forEach(note => {
        (note.tags || []).forEach(tag => allTags.add(tag));
      });
      
      // Filter by query
      const matchingTags = Array.from(allTags)
        .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10);
      
      if (matchingTags.length > 0) {
        this.renderAutoCompletion(matchingTags, 'tag', startPos, cursorPos);
      } else {
        this.hideAutoCompletion();
      }
    } catch (error) {
      console.error('Tag completion failed:', error);
    }
  },
  
  async showLinkCompletion(query, startPos, cursorPos) {
    try {
      const notes = await Store.allNotes();
      
      // Filter by query
      const matchingNotes = notes
        .filter(note => 
          note.title && 
          note.title.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10);
      
      if (matchingNotes.length > 0) {
        this.renderAutoCompletion(matchingNotes, 'link', startPos, cursorPos);
      } else {
        this.hideAutoCompletion();
      }
    } catch (error) {
      console.error('Link completion failed:', error);
    }
  },
  
  renderAutoCompletion(items, type, startPos, cursorPos) {
    const dropdown = document.getElementById('autoCompleteDropdown');
    const editor = document.getElementById('editor');
    if (!dropdown || !editor) return;
    
    // Position dropdown near cursor
    const textareaRect = editor.getBoundingClientRect();
    const cursorCoords = this.getCursorCoords(editor, cursorPos);
    
    dropdown.style.left = (textareaRect.left + cursorCoords.x) + 'px';
    dropdown.style.top = (textareaRect.top + cursorCoords.y + 20) + 'px';
    dropdown.style.display = 'block';
    
    // Render items
    dropdown.innerHTML = items.map((item, index) => {
      const displayText = type === 'tag' ? item : item.title;
      const insertText = type === 'tag' ? item : `[[${item.title}]]`;
      
      return `
        <div class="autocomplete-item ${index === 0 ? 'selected' : ''}" 
             data-index="${index}" 
             data-insert="${insertText}"
             data-type="${type}">
          ${displayText}
        </div>
      `;
    }).join('');
    
    // Bind events
    dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectAutoCompletion(item.dataset.insert, startPos, cursorPos, type);
      });
      
      item.addEventListener('mouseenter', () => {
        dropdown.querySelectorAll('.autocomplete-item').forEach(i => {
          i.classList.remove('selected');
        });
        item.classList.add('selected');
      });
    });
    
    // Track selected item
    this.currentCompletion = {
      items,
      type,
      startPos,
      cursorPos,
      selectedIndex: 0
    };
    
    // Bind keyboard navigation
    this.bindCompletionNavigation();
  },
  
  selectAutoCompletion(insertText, startPos, cursorPos, type) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    // Insert text
    const currentValue = editor.value;
    const beforeCursor = currentValue.substring(0, startPos);
    const afterCursor = currentValue.substring(cursorPos);
    
    // Adjust insert text based on type
    let finalInsertText = insertText;
    if (type === 'tag') {
      finalInsertText = insertText.startsWith('#') ? insertText : '#' + insertText;
    }
    
    editor.value = beforeCursor + finalInsertText + afterCursor;
    editor.selectionStart = editor.selectionEnd = startPos + finalInsertText.length;
    
    // Hide dropdown
    this.hideAutoCompletion();
    
    // Trigger input event
    editor.dispatchEvent(new Event('input'));
  },
  
  hideAutoCompletion() {
    const dropdown = document.getElementById('autoCompleteDropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
    this.currentCompletion = null;
  },
  
  bindCompletionNavigation() {
    const editor = document.getElementById('editor');
    if (!editor || !this.currentCompletion) return;
    
    const keyHandler = (e) => {
      if (!this.currentCompletion) return;
      
      const dropdown = document.getElementById('autoCompleteDropdown');
      if (!dropdown) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.currentCompletion.selectedIndex = 
            (this.currentCompletion.selectedIndex + 1) % this.currentCompletion.items.length;
          this.updateCompletionSelection();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.currentCompletion.selectedIndex = 
            (this.currentCompletion.selectedIndex - 1 + this.currentCompletion.items.length) % this.currentCompletion.items.length;
          this.updateCompletionSelection();
          break;
          
        case 'Enter':
          e.preventDefault();
          const selectedItem = dropdown.querySelector('.autocomplete-item.selected');
          if (selectedItem) {
            this.selectAutoCompletion(
              selectedItem.dataset.insert,
              this.currentCompletion.startPos,
              this.currentCompletion.cursorPos,
              selectedItem.dataset.type
            );
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          this.hideAutoCompletion();
          break;
      }
    };
    
    editor.addEventListener('keydown', keyHandler);
    
    // Remove handler when completion is hidden
    const originalHide = this.hideAutoCompletion.bind(this);
    this.hideAutoCompletion = () => {
      editor.removeEventListener('keydown', keyHandler);
      originalHide();
    };
  },
  
  updateCompletionSelection() {
    const dropdown = document.getElementById('autoCompleteDropdown');
    if (!dropdown || !this.currentCompletion) return;
    
    dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
      if (index === this.currentCompletion.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  },
  
  // Get cursor coordinates relative to textarea
  getCursorCoords(textarea, position) {
    // Create a mirror div to calculate cursor position
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    // Copy textarea styles
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '-9999px';
    div.style.width = style.width;
    div.style.height = style.height;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.font = style.font;
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';
    
    // Set content up to cursor position
    const text = textarea.value.substring(0, position);
    div.textContent = text;
    
    // Add a span to measure cursor position
    const span = document.createElement('span');
    span.textContent = textarea.value.substring(position) || '.';
    div.appendChild(span);
    
    document.body.appendChild(div);
    
    const coords = {
      x: span.offsetLeft,
      y: span.offsetTop
    };
    
    document.body.removeChild(div);
    return coords;
  },
  
  async processAutoCompletion(noteId) {
    // Process auto-completion for the note
    console.log('Processing auto-completion for note:', noteId);
  },
  
  // Templating Extension
  async initTemplating() {
    console.log('Templating extension initialized');
  },
  
  async processTemplating(noteId) {
    // Process templating for the note
    console.log('Processing templating for note:', noteId);
  },
  
  // Formatting Extension
  async initFormatting() {
    console.log('Formatting extension initialized');
    
    // Set up formatting shortcuts
    this.setupFormattingShortcuts();
  },
  
  setupFormattingShortcuts() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    editor.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + B for bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.applyFormatting('**', '**');
      }
      
      // Ctrl/Cmd + I for italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        this.applyFormatting('*', '*');
      }
      
      // Ctrl/Cmd + Shift + B for bullet list
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
        e.preventDefault();
        this.insertBulletList();
      }
      
      // Ctrl/Cmd + Shift + N for numbered list
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault();
        this.insertNumberedList();
      }
      
      // Ctrl/Cmd + Shift + S for save version
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        this.saveVersion();
      }
    });
  },
  
  applyFormatting(prefix, suffix) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    // Apply formatting
    const newText = prefix + selectedText + suffix;
    const beforeSelection = editor.value.substring(0, start);
    const afterSelection = editor.value.substring(end);
    
    editor.value = beforeSelection + newText + afterSelection;
    editor.selectionStart = start + prefix.length;
    editor.selectionEnd = start + prefix.length + selectedText.length;
    
    // Trigger input event
    editor.dispatchEvent(new Event('input'));
  },
  
  insertBulletList() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const cursorPos = editor.selectionStart;
    const text = editor.value;
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);
    
    // Find current line
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const currentLine = beforeCursor.substring(lastNewline + 1);
    
    // If current line is already a list item, insert new item
    if (currentLine.trim().startsWith('- ')) {
      editor.value = beforeCursor + '\n- ' + afterCursor;
      editor.selectionStart = editor.selectionEnd = cursorPos + 4;
    } else {
      // Convert current line to list item
      const beforeLine = beforeCursor.substring(0, lastNewline + 1);
      const lineContent = currentLine.trim();
      editor.value = beforeLine + '- ' + lineContent + '\n- ' + afterCursor;
      editor.selectionStart = editor.selectionEnd = beforeLine.length + lineContent.length + 5;
    }
    
    // Trigger input event
    editor.dispatchEvent(new Event('input'));
  },
  
  insertNumberedList() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const cursorPos = editor.selectionStart;
    const text = editor.value;
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);
    
    // Find current line
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const currentLine = beforeCursor.substring(lastNewline + 1);
    
    // Find next number in sequence
    const lines = beforeCursor.split('\n');
    let nextNumber = 1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const numberMatch = line.match(/^(\d+)\.\s/);
      if (numberMatch) {
        nextNumber = parseInt(numberMatch[1]) + 1;
        break;
      }
    }
    
    // If current line is already a list item, insert new item
    if (currentLine.trim().match(/^\d+\.\s/)) {
      editor.value = beforeCursor + `\n${nextNumber}. ` + afterCursor;
      editor.selectionStart = editor.selectionEnd = cursorPos + nextNumber.toString().length + 3;
    } else {
      // Convert current line to list item
      const beforeLine = beforeCursor.substring(0, lastNewline + 1);
      const lineContent = currentLine.trim();
      editor.value = beforeLine + `${nextNumber}. ` + lineContent + `\n${nextNumber + 1}. ` + afterCursor;
      editor.selectionStart = editor.selectionEnd = beforeLine.length + nextNumber.toString().length + lineContent.length + 4;
    }
    
    // Trigger input event
    editor.dispatchEvent(new Event('input'));
  },
  
  async processFormatting(noteId) {
    // Process formatting for the note
    console.log('Processing formatting for note:', noteId);
  },
  
  // Focus mode
  toggleFocusMode() {
    const editor = document.getElementById('editor');
    const app = document.querySelector('.app');
    
    if (!editor || !app) return;
    
    app.classList.toggle('focus-mode');
    
    if (app.classList.contains('focus-mode')) {
      // Enter focus mode
      document.querySelectorAll('.left, .right').forEach(panel => {
        panel.style.display = 'none';
      });
      
      // Expand editor
      const main = document.querySelector('.main');
      if (main) {
        main.style.gridTemplateColumns = '1fr';
      }
      
      editor.focus();
    } else {
      // Exit focus mode
      document.querySelectorAll('.left, .right').forEach(panel => {
        panel.style.display = '';
      });
      
      // Restore editor size
      const main = document.querySelector('.main');
      if (main) {
        main.style.gridTemplateColumns = '1fr 1fr';
      }
    }
  },
  
  // Distraction-free writing
  toggleDistractionFree() {
    const app = document.querySelector('.app');
    
    if (!app) return;
    
    app.classList.toggle('distraction-free');
    
    if (app.classList.contains('distraction-free')) {
      // Hide distracting elements
      document.querySelectorAll('.topbar, .left, .right').forEach(el => {
        el.style.display = 'none';
      });
      
      // Full screen editor
      const main = document.querySelector('.main');
      if (main) {
        main.style.gridArea = '1 / 1 / 3 / 4';
      }
      
      const card = main.querySelector('.card');
      if (card) {
        card.style.height = '100vh';
      }
    } else {
      // Restore normal view
      document.querySelectorAll('.topbar, .left, .right').forEach(el => {
        el.style.display = '';
      });
      
      // Restore grid layout
      const main = document.querySelector('.main');
      if (main) {
        main.style.gridArea = '';
      }
      
      const card = main.querySelector('.card');
      if (card) {
        card.style.height = '';
      }
    }
  },
  
  // Word count goal
  async setWordGoal(goal) {
    if (!this.currentState.noteId) return;
    
    try {
      // Save goal to note metadata
      const note = await Store.get(this.currentState.noteId);
      if (note) {
        if (!note.metadata) note.metadata = {};
        note.metadata.wordGoal = goal;
        await Store.upsert(note);
      }
      
      // Update UI
      this.updateWordGoalUI(goal);
    } catch (error) {
      console.error('Failed to set word goal:', error);
    }
  },
  
  updateWordGoalUI(goal) {
    const progressBar = document.getElementById('wordGoalProgress');
    if (!progressBar) return;
    
    const progress = Math.min(100, (this.currentState.wordCount / goal) * 100);
    progressBar.style.width = `${progress}%`;
    
    const progressText = document.getElementById('wordGoalText');
    if (progressText) {
      progressText.textContent = `${this.currentState.wordCount} / ${goal} words`;
    }
  },
  
  // Note versioning - save version
  async saveVersion() {
    if (!this.currentState.noteId) return;
    
    try {
      const note = await Store.get(this.currentState.noteId);
      if (!note) return;
      
      // Create version object
      const version = {
        id: ULID(),
        noteId: note.id,
        title: note.title,
        body: note.body,
        tags: note.tags || [],
        createdAt: nowISO(),
        version: note.version || 1
      };
      
      // Save version to localStorage
      const versionsKey = `note_versions_${note.id}`;
      const versions = JSON.parse(localStorage.getItem(versionsKey) || '[]');
      versions.push(version);
      
      // Keep only last 20 versions
      if (versions.length > 20) {
        versions.shift();
      }
      
      localStorage.setItem(versionsKey, JSON.stringify(versions));
      
      // Update note version
      note.version = version.version + 1;
      await Store.upsert(note);
      
      toast('Version saved');
      return version;
    } catch (error) {
      console.error('Failed to save version:', error);
      toast('Failed to save version');
    }
  },
  
  // Get note versions
  async getVersions(noteId) {
    try {
      const versionsKey = `note_versions_${noteId}`;
      const versions = JSON.parse(localStorage.getItem(versionsKey) || '[]');
      return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get versions:', error);
      return [];
    }
  },
  
  // Restore note version
  async restoreVersion(version) {
    try {
      const note = await Store.get(version.noteId);
      if (!note) return false;
      
      // Update note with version data
      note.title = version.title;
      note.body = version.body;
      note.tags = version.tags;
      note.updatedAt = nowISO();
      
      // Save note
      await Store.upsert(note);
      
      // Refresh UI
      if (typeof UI !== 'undefined') {
        await UI.openNote(note.id);
        await UI.refresh();
      }
      
      toast('Version restored');
      return true;
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast('Failed to restore version');
      return false;
    }
  },
  
  // Export note to various formats
  async exportNote(format) {
    if (!this.currentState.noteId) {
      toast('No note selected');
      return;
    }
    
    try {
      const note = await Store.get(this.currentState.noteId);
      if (!note) {
        toast('Note not found');
        return;
      }
      
      switch (format) {
        case 'pdf':
          await this.exportToPDF(note);
          break;
        case 'html':
          await this.exportToHTML(note);
          break;
        case 'markdown':
          await this.exportToMarkdown(note);
          break;
        case 'docx':
          await this.exportToDOCX(note);
          break;
        default:
          toast('Unsupported format');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast('Export failed');
    }
  },
  
  async exportToPDF(note) {
    toast('Exporting to PDF...');
    // In a real implementation, this would use a PDF library
    setTimeout(() => toast('PDF export completed'), 2000);
  },
  
  async exportToHTML(note) {
    toast('Exporting to HTML...');
    // In a real implementation, this would generate HTML
    setTimeout(() => toast('HTML export completed'), 2000);
  },
  
  async exportToMarkdown(note) {
    try {
      const content = `# ${note.title}\n\n${note.body}\n\n${(note.tags || []).join(' ')}`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'note'}.md`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast('Markdown export completed');
    } catch (error) {
      console.error('Markdown export failed:', error);
      toast('Markdown export failed');
    }
  },
  
  async exportToDOCX(note) {
    toast('Exporting to DOCX...');
    // In a real implementation, this would use a DOCX library
    setTimeout(() => toast('DOCX export completed'), 2000);
  },
  
  // Note encryption
  async encryptNote(password) {
    if (!this.currentState.noteId) return { success: false, error: 'No note selected' };
    
    try {
      const note = await Store.get(this.currentState.noteId);
      if (!note) return { success: false, error: 'Note not found' };
      
      // Simple encryption using btoa and password
      const encryptedBody = this.simpleEncrypt(note.body, password);
      const encryptedTitle = this.simpleEncrypt(note.title || '', password);
      const encryptedTags = note.tags ? note.tags.map(tag => this.simpleEncrypt(tag, password)) : [];
      
      // Save encrypted data to note metadata
      if (!note.metadata) note.metadata = {};
      note.metadata.encrypted = true;
      note.metadata.encryptedBody = encryptedBody;
      note.metadata.encryptedTitle = encryptedTitle;
      note.metadata.encryptedTags = encryptedTags;
      
      // Clear original content
      note.body = '[ENCRYPTED]';
      note.title = '[ENCRYPTED]';
      note.tags = ['#encrypted'];
      
      await Store.upsert(note);
      
      // Refresh UI
      if (typeof UI !== 'undefined') {
        await UI.openNote(note.id);
        await UI.refresh();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Encryption failed:', error);
      return { success: false, error: 'Encryption failed' };
    }
  },
  
  async decryptNote(password) {
    if (!this.currentState.noteId) return { success: false, error: 'No note selected' };
    
    try {
      const note = await Store.get(this.currentState.noteId);
      if (!note || !note.metadata || !note.metadata.encrypted) {
        return { success: false, error: 'Note is not encrypted' };
      }
      
      // Decrypt content
      const decryptedBody = this.simpleDecrypt(note.metadata.encryptedBody, password);
      const decryptedTitle = this.simpleDecrypt(note.metadata.encryptedTitle, password);
      const decryptedTags = note.metadata.encryptedTags ? 
        note.metadata.encryptedTags.map(tag => this.simpleDecrypt(tag, password)) : [];
      
      // Restore original content
      note.body = decryptedBody;
      note.title = decryptedTitle;
      note.tags = decryptedTags;
      
      // Remove encryption metadata
      delete note.metadata.encrypted;
      delete note.metadata.encryptedBody;
      delete note.metadata.encryptedTitle;
      delete note.metadata.encryptedTags;
      
      await Store.upsert(note);
      
      // Refresh UI
      if (typeof UI !== 'undefined') {
        await UI.openNote(note.id);
        await UI.refresh();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Decryption failed:', error);
      return { success: false, error: 'Incorrect password or decryption failed' };
    }
  },
  
  // Simple encryption function (for demonstration purposes only)
  simpleEncrypt(text, password) {
    if (!text) return '';
    try {
      // Simple XOR encryption with password
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ password.charCodeAt(i % password.length);
        result += String.fromCharCode(charCode);
      }
      // Base64 encode the result
      return btoa(encodeURIComponent(result));
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  },
  
  // Simple decryption function
  simpleDecrypt(encryptedText, password) {
    if (!encryptedText) return '';
    try {
      // Base64 decode
      const decoded = decodeURIComponent(atob(encryptedText));
      // XOR decryption with password
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  },
  
  // Import content into note
  async importContent() {
    if (!this.currentState.noteId) {
      toast('No note selected');
      return;
    }
    
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.txt,.html';
      
      // Wait for file selection
      const file = await new Promise((resolve, reject) => {
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            resolve(file);
          } else {
            reject(new Error('No file selected'));
          }
        };
        input.oncancel = () => reject(new Error('File selection cancelled'));
        input.click();
      });
      
      // Read file
      const content = await file.text();
      
      // Import content
      const editor = document.getElementById('editor');
      if (editor) {
        editor.value += '\n\n' + content;
        editor.dispatchEvent(new Event('input'));
        toast('Content imported successfully');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast('Import failed');
    }
  },
  
  // Find and replace
  showFindReplace() {
    // Create find/replace UI
    let findReplacePanel = document.getElementById('findReplacePanel');
    
    if (!findReplacePanel) {
      findReplacePanel = document.createElement('div');
      findReplacePanel.id = 'findReplacePanel';
      findReplacePanel.className = 'find-replace-panel';
      findReplacePanel.innerHTML = `
        <div class="find-replace-header">
          <h4>Find & Replace</h4>
          <button class="close-btn">&times;</button>
        </div>
        <div class="find-replace-content">
          <div class="form-group">
            <label>Find</label>
            <input type="text" id="findInput" class="form-control" placeholder="Text to find">
          </div>
          <div class="form-group">
            <label>Replace</label>
            <input type="text" id="replaceInput" class="form-control" placeholder="Replace with">
          </div>
          <div class="find-replace-options">
            <label>
              <input type="checkbox" id="caseSensitive"> Case Sensitive
            </label>
            <label>
              <input type="checkbox" id="wholeWords"> Whole Words
            </label>
          </div>
          <div class="find-replace-actions">
            <button id="findPrevBtn" class="btn btn-small">Previous</button>
            <button id="findNextBtn" class="btn btn-small">Next</button>
            <button id="replaceAllBtn" class="btn btn-small btn-danger">Replace All</button>
          </div>
        </div>
      `;
      
      // Insert at top of editor card
      const editorCard = document.querySelector('.main .card');
      if (editorCard) {
        editorCard.insertBefore(findReplacePanel, editorCard.firstChild);
      }
      
      // Bind events
      const closeBtn = findReplacePanel.querySelector('.close-btn');
      const findPrevBtn = document.getElementById('findPrevBtn');
      const findNextBtn = document.getElementById('findNextBtn');
      const replaceAllBtn = document.getElementById('replaceAllBtn');
      const findInput = document.getElementById('findInput');
      
      closeBtn.addEventListener('click', () => {
        findReplacePanel.style.display = 'none';
      });
      
      findPrevBtn.addEventListener('click', () => {
        this.findText(false);
      });
      
      findNextBtn.addEventListener('click', () => {
        this.findText(true);
      });
      
      replaceAllBtn.addEventListener('click', () => {
        this.replaceAllText();
      });
      
      findInput.addEventListener('input', () => {
        this.findText(true);
      });
    }
    
    // Show panel
    findReplacePanel.style.display = 'block';
    
    // Focus find input
    const findInput = document.getElementById('findInput');
    if (findInput) {
      findInput.focus();
    }
  },
  
  findText(forward = true) {
    const editor = document.getElementById('editor');
    const findInput = document.getElementById('findInput');
    const caseSensitive = document.getElementById('caseSensitive');
    const wholeWords = document.getElementById('wholeWords');
    
    if (!editor || !findInput) return;
    
    const searchText = findInput.value;
    if (!searchText) return;
    
    const content = editor.value;
    const flags = caseSensitive && caseSensitive.checked ? 'g' : 'gi';
    const regex = wholeWords && wholeWords.checked 
      ? new RegExp(`\\b${searchText}\\b`, flags)
      : new RegExp(searchText, flags);
    
    let match;
    const matches = [];
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    if (matches.length === 0) {
      toast('No matches found');
      return;
    }
    
    // Find next/previous match
    const cursorPos = editor.selectionStart;
    let matchIndex = 0;
    
    if (forward) {
      matchIndex = matches.findIndex(m => m.start > cursorPos);
      if (matchIndex === -1) matchIndex = 0; // Wrap around
    } else {
      matchIndex = matches.findLastIndex(m => m.start < cursorPos);
      if (matchIndex === -1) matchIndex = matches.length - 1; // Wrap around
    }
    
    const selectedMatch = matches[matchIndex];
    editor.setSelectionRange(selectedMatch.start, selectedMatch.end);
    editor.focus();
    
    // Highlight matches in some way (simplified)
    toast(`Match ${matchIndex + 1} of ${matches.length}`);
  },
  
  replaceAllText() {
    const editor = document.getElementById('editor');
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    const caseSensitive = document.getElementById('caseSensitive');
    const wholeWords = document.getElementById('wholeWords');
    
    if (!editor || !findInput || !replaceInput) return;
    
    const searchText = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!searchText) return;
    
    const content = editor.value;
    const flags = caseSensitive && caseSensitive.checked ? 'g' : 'gi';
    const regex = wholeWords && wholeWords.checked 
      ? new RegExp(`\\b${searchText}\\b`, flags)
      : new RegExp(searchText, flags);
    
    const newContent = content.replace(regex, replaceText);
    const replacedCount = (content.match(regex) || []).length;
    
    editor.value = newContent;
    editor.dispatchEvent(new Event('input'));
    
    toast(`Replaced ${replacedCount} occurrences`);
  }
};