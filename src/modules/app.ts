// Enhanced App Module with Monaco Editor Integration
import type { Note } from '../types/index.js';
import { Store } from './store.js';
import { Search } from './search.js';
import { Router } from './router.js';
import { Performance } from './performance.js';
import { MonacoEditor } from './monaco-editor.js';
import { el, toast, renderMD, debounce, ULID } from './util.js';

interface EditorMode {
  type: 'textarea' | 'monaco';
  enabled: boolean;
}

class ApplicationManager {
  private currentNote: Note | null = null;
  private editorMode: EditorMode = { type: 'textarea', enabled: true };
  private monacoContainer: HTMLElement | null = null;
  private isInitialized = false;
  private autoSaveEnabled = true;
  private saveTimeout: number | null = null;
  // Slash menu state
  private slashMenuEl: HTMLElement | null = null;
  private slashActive = false;
  private slashStartCol: number | null = null;
  private slashLine: number | null = null;
  private slashSelectionIndex = 0;
  
  // Simple fuzzy score: higher is better; -1 for no match
  private fuzzyScore(text: string, query: string): number {
    const t = (text || '').toLowerCase();
    const q = (query || '').toLowerCase().trim();
    if (!q) return 0;
    let ti = 0, score = 0, streak = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const ch = q[qi];
      let found = false;
      while (ti < t.length) {
        if (t[ti] === ch) { found = true; break; }
        ti++;
        streak = 0;
      }
      if (!found) return -1;
      // Boost for start of word or contiguous streak
      const startOfWord = ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === ':';
      streak++;
      score += 1 + (startOfWord ? 2 : 0) + Math.min(streak, 3);
      ti++;
    }
    // Prefer shorter texts slightly
    return score - Math.max(0, t.length - q.length) * 0.02;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    Performance.mark('app-ui-init-start');
    
    try {
      console.log('🎯 Initializing Enhanced Application UI...');

      // Initialize core modules
      await this.initializeCoreModules();

      // Setup UI components
      this.setupEventHandlers();
      this.setupKeyboardShortcuts();
      
      // Initialize editor (try Monaco, fallback to textarea)
      await this.initializeEditor();
      
      // Load initial data
      await this.loadInitialData();
      
      // Show the application
      this.showApplication();
      
      Performance.mark('app-ui-init-end');
      Performance.measure('app-ui-initialization', 'app-ui-init-start', 'app-ui-init-end');
      
      this.isInitialized = true;
      console.log('✅ Application UI initialized successfully');
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.showErrorState(error as Error);
      throw error;
    }
  }

  private async initializeCoreModules(): Promise<void> {
    // Initialize Store
    if (typeof Store.init === 'function') {
      await Store.init();
    }

    // Initialize Search
    if (typeof Search.init === 'function') {
      await Search.init();
    }

    // Register router pages
    Router.registerDefaultPages();
  }

  private async initializeEditor(): Promise<void> {
    try {
      // Try to initialize Monaco Editor
      await MonacoEditor.init();
      
      // Create Monaco container (initially hidden)
      const editorPanel = el('#note-body')?.parentElement;
      if (editorPanel) {
        this.monacoContainer = document.createElement('div');
        this.monacoContainer.id = 'monaco-container';
        this.monacoContainer.className = 'w-full h-full';
        editorPanel.appendChild(this.monacoContainer);
      }

      // Default to Monaco if container exists
      const bodyTextarea = el('#note-body') as HTMLTextAreaElement;
      const initialContent = bodyTextarea?.value || '';
      if (this.monacoContainer) {
        await MonacoEditor.createEditor(this.monacoContainer, initialContent);
        MonacoEditor.onChange(() => this.updateNoteBody());
        if (bodyTextarea) bodyTextarea.classList.add('hidden');
        this.editorMode.type = 'monaco';
        console.log('✅ Monaco Editor active by default');
      } else {
        console.log('✅ Monaco Editor available');
      }
    } catch (error) {
      console.warn('⚠️ Monaco Editor failed to initialize, using textarea fallback:', error);
    }
  }

  private setupEventHandlers(): void {
    // Note creation
    const newNoteBtn = el('#new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.addEventListener('click', () => this.createNewNote());
    }

    // Save button
    const saveBtn = el('#save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentNote());
    }

    // Search
    const searchInput = el('#search-input');
    if (searchInput) {
      const debouncedSearch = debounce((query: string) => this.performSearch(query), 300);
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value;
        debouncedSearch(query);
      });
    }

    // Note title input
    const titleInput = el('#note-title') as HTMLInputElement;
    if (titleInput) {
      const debouncedTitleUpdate = debounce(() => this.updateNoteTitle(), 500);
      titleInput.addEventListener('input', debouncedTitleUpdate);
    }

    // Note body input (textarea fallback)
    const bodyTextarea = el('#note-body') as HTMLTextAreaElement;
    if (bodyTextarea) {
      const debouncedBodyUpdate = debounce(() => this.updateNoteBody(), 500);
      bodyTextarea.addEventListener('input', debouncedBodyUpdate);
    }

    // Editor mode toggle
    this.setupEditorModeToggle();

    // Theme toggle
    const themeToggle = el('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Formatting toolbar (textarea mode)
    const getTextarea = () => el('#note-body') as HTMLTextAreaElement | null;

    const wrapSelection = (prefix: string, suffix: string) => {
      if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
        MonacoEditor.applyWrap(prefix, suffix);
        this.updateNoteBody();
        return;
      }
      const ta = getTextarea();
      if (!ta) return;
      const start = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      const before = ta.value.substring(0, start);
      const selected = ta.value.substring(start, end);
      const after = ta.value.substring(end);
      ta.value = before + prefix + selected + suffix + after;
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = end + prefix.length;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      this.updateNoteBody();
    };

    const applyAtLineStart = (token: string) => {
      if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
        MonacoEditor.applyLinePrefix(token);
        this.updateNoteBody();
        return;
      }
      const ta = getTextarea();
      if (!ta) return;
      const start = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      const value = ta.value;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', end);
      const endPos = lineEnd === -1 ? value.length : lineEnd;
      const line = value.substring(lineStart, endPos);
      const newLine = line.startsWith(token) ? line : token + (line.startsWith(' ') ? '' : ' ') + line;
      ta.value = value.substring(0, lineStart) + newLine + value.substring(endPos);
      ta.selectionStart = start + token.length + 1;
      ta.selectionEnd = end + token.length + 1;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      this.updateNoteBody();
    };

    const insertAtCursor = (text: string) => {
      if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
        // Use Monaco replace selection
        MonacoEditor.applyWrap(text, '');
        this.updateNoteBody();
        return;
      }
      const ta = getTextarea();
      if (!ta) return;
      const start = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      const before = ta.value.substring(0, start);
      const after = ta.value.substring(end);
      ta.value = before + text + after;
      const pos = start + text.length;
      ta.selectionStart = ta.selectionEnd = pos;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      this.updateNoteBody();
    };

    const onClick = (id: string, fn: () => void) => {
      const btn = el(`#${id}`);
      if (btn) btn.addEventListener('click', fn);
    };

    onClick('btn-bold', () => wrapSelection('**', '**'));
    onClick('btn-italic', () => wrapSelection('*', '*'));
    onClick('btn-link', () => wrapSelection('[', '](url)'));
    onClick('btn-wikilink', () => wrapSelection('[[', ']]'));
    onClick('btn-code', () => wrapSelection('```\\n', '\\n```'));
    onClick('btn-quote', () => applyAtLineStart('>'));
    onClick('btn-check', () => applyAtLineStart('- [ ]'));
    onClick('btn-h1', () => applyAtLineStart('#'));
    onClick('btn-h2', () => applyAtLineStart('##'));
    onClick('btn-h3', () => applyAtLineStart('###'));

    // Toggle preview
    const previewPanel = el('#preview-panel') as HTMLElement | null;
    onClick('btn-toggle-preview', () => {
      if (!previewPanel) return;
      const hidden = previewPanel.classList.toggle('hidden');
      const btn = el('#btn-toggle-preview');
      if (btn) btn.querySelector('span')!.textContent = hidden ? 'Preview Off' : 'Preview';
    });

    // Toggle outline
    onClick('btn-outline', () => this.toggleOutlinePanel());

    // Toggle editor mode
    onClick('btn-toggle-editor-mode', () => this.toggleEditorMode());

    // Resizable splitter
    const splitter = el('#editor-splitter') as HTMLElement | null;
    const editorCol = getTextarea()?.closest('.flex-1.flex.flex-col') as HTMLElement | null;
    if (splitter && editorCol && previewPanel) {
      // Load persisted width
      const saved = localStorage.getItem('editorSplitLeft');
      if (saved) {
        const leftPct = Math.min(Math.max(parseFloat(saved), 20), 80);
        editorCol.style.width = leftPct + '%';
        previewPanel.style.width = (100 - leftPct) + '%';
      }
      let dragging = false;
      const onMove = (e: MouseEvent) => {
        if (!dragging) return;
        const container = splitter.parentElement as HTMLElement;
        const rect = container.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, rect.width * 0.2), rect.width * 0.8);
        const leftPct = (x / rect.width) * 100;
        editorCol.style.width = leftPct + '%';
        previewPanel.style.width = (100 - leftPct) + '%';
      };
      splitter.addEventListener('mousedown', () => { dragging = true; document.body.style.userSelect = 'none'; });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', () => { 
        if (dragging) {
          // Persist width
          const leftPct = parseFloat(editorCol.style.width);
          if (!Number.isNaN(leftPct)) localStorage.setItem('editorSplitLeft', String(leftPct));
        }
        dragging = false; 
        document.body.style.userSelect = ''; 
      });
    }

    // Command Palette
    const openCommandPalette = (prefill: string = '') => {
      const mc = el('#modal-container') as HTMLElement;
      if (!mc) return;
      mc.classList.remove('hidden');
      mc.innerHTML = `
        <div class="modal">
          <div class="modal-backdrop"></div>
          <div class="modal-content max-w-2xl">
            <div class="modal-header flex items-center">
              <div class="modal-title">Command Palette</div>
              <button id="cmd-close" class="modal-close" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <input id="cmd-input" class="input" placeholder="Type a command... (e.g., heading, bold, toggle)" />
              <div id="cmd-list" class="mt-3 max-h-72 overflow-auto"></div>
            </div>
          </div>
        </div>`;

      const commands = [
        { id: 'bold', icon: 'fa-bold', label: 'Format: Bold', run: () => wrapSelection('**', '**') },
        { id: 'italic', icon: 'fa-italic', label: 'Format: Italic', run: () => wrapSelection('*', '*') },
        { id: 'h1', icon: 'fa-heading', label: 'Heading 1', run: () => applyAtLineStart('#') },
        { id: 'h2', icon: 'fa-heading', label: 'Heading 2', run: () => applyAtLineStart('##') },
        { id: 'h3', icon: 'fa-heading', label: 'Heading 3', run: () => applyAtLineStart('###') },
        { id: 'link', icon: 'fa-link', label: 'Insert Link', run: () => wrapSelection('[', '](url)') },
        { id: 'wikilink', icon: 'fa-bookmark', label: 'Insert Wikilink', run: () => wrapSelection('[[', ']]') },
        { id: 'check', icon: 'fa-square', label: 'Insert Checklist Item', run: () => applyAtLineStart('- [ ]') },
        { id: 'quote', icon: 'fa-quote-left', label: 'Insert Quote', run: () => applyAtLineStart('>') },
      { id: 'code', icon: 'fa-code', label: 'Insert Code Block', run: () => wrapSelection('```\n', '\n```') },
      // Templates
      { id: 'tpl-meeting', label: 'Template: Meeting Notes', run: () => insertAtCursor(`# Meeting Notes\n\n## Attendees\n- \n\n## Agenda\n1. \n\n## Notes\n- \n\n## Action Items\n- [ ] \n`) },
      { id: 'tpl-project', label: 'Template: Project Brief', run: () => insertAtCursor(`# Project Brief\n\n## Goal\n- \n\n## Tasks\n- [ ] \n\n## Resources\n- \n\n## Timeline\n- Start: {{date}}\n- Due: {{date:14d}}\n`) },
      { id: 'tpl-research', label: 'Template: Research Note', run: () => insertAtCursor(`# Research: {{title}}\n\n## Source\n- \n\n## Key Points\n- \n\n## Questions\n- \n\n## Summary\n- \n`) },
      // Notes and navigation
      { id: 'toggle-outline', icon: 'fa-list', label: 'View: Toggle Outline', run: () => this.toggleOutlinePanel() },
      { id: 'duplicate-note', icon: 'fa-copy', label: 'Note: Duplicate Current', run: () => this.duplicateCurrentNote() },
      { id: 'goto-editor', icon: 'fa-edit', label: 'Navigate: Editor', run: () => { window.location.hash = '#/'; } },
      { id: 'goto-graph', icon: 'fa-project-diagram', label: 'Navigate: Graph', run: () => { window.location.hash = '#/graph'; } },
      { id: 'goto-tags', icon: 'fa-hashtag', label: 'Navigate: Tags', run: () => { window.location.hash = '#/tags'; } },
      { id: 'goto-settings', icon: 'fa-gear', label: 'Navigate: Settings', run: () => { window.location.hash = '#/settings'; } },
        { id: 'toggle-preview', icon: 'fa-eye', label: 'Toggle Preview', run: () => (el('#btn-toggle-preview') as HTMLElement)?.click() },
        { id: 'switch-editor', icon: 'fa-pen', label: 'Switch Editor (Monaco/Textarea)', run: () => this.toggleEditorMode() },
        { id: 'new-note', icon: 'fa-plus', label: 'New Note', run: () => this.createNewNote() },
        { id: 'save-note', icon: 'fa-save', label: 'Save Note', run: () => this.saveCurrentNote() },
        { id: 'toggle-theme', icon: 'fa-moon', label: 'Toggle Theme', run: () => this.toggleTheme() },
        // Extras
        { id: 'focus-search', icon: 'fa-search', label: 'Search: Focus Search Bar', run: () => { const s = el('#search-input') as HTMLInputElement; if (s) s.focus(); } },
        { id: 'export-data', icon: 'fa-download', label: 'Data: Export', run: () => { const b = el('#export-btn') as HTMLElement; if (b) b.click(); else toast('Open Settings to export', 'info'); } },
        { id: 'copy-link', icon: 'fa-link', label: 'Share: Copy Note Link', run: () => this.copyNoteLinkToClipboard() }
      ];

      const input = el('#cmd-input') as HTMLInputElement;
      const list = el('#cmd-list') as HTMLElement;
      const close = () => { mc.classList.add('hidden'); mc.innerHTML = ''; };
      const render = (query: string) => {
        const q = query.toLowerCase();
        const scored = commands
          .map((c) => ({ c, s: this.fuzzyScore(c.label, q) }))
          .filter(x => x.s >= 0)
          .sort((a, b) => b.s - a.s)
          .map(x => x.c);
        list.innerHTML = scored.map((c, i) => `<div class="dropdown-item" data-idx="${i}"><i class="fas ${c.icon || 'fa-circle'} mr-2"></i>${c.label}</div>`).join('') || '<div class="text-sm text-neutral-500 px-4 py-2">No commands</div>';
      };
      render(prefill);
      input.value = prefill;
      input.focus();

      list.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('[data-idx]') as HTMLElement;
        if (!item) return;
        const idx = parseInt(item.dataset.idx || '0', 10);
        const q = input.value.toLowerCase();
        const scored = commands
          .map((c) => ({ c, s: this.fuzzyScore(c.label, q) }))
          .filter(x => x.s >= 0)
          .sort((a, b) => b.s - a.s)
          .map(x => x.c);
        const cmd = scored[idx];
        if (cmd) { cmd.run(); close(); }
      });
      input.addEventListener('input', () => render(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        if (e.key === 'Enter') {
          const q = input.value.toLowerCase();
          const scored = commands
            .map((c) => ({ c, s: this.fuzzyScore(c.label, q) }))
            .filter(x => x.s >= 0)
            .sort((a, b) => b.s - a.s)
            .map(x => x.c);
          if (scored[0]) { scored[0].run(); close(); }
        }
      });
      const closeBtn = el('#cmd-close');
      if (closeBtn) closeBtn.addEventListener('click', close);
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.addEventListener('click', close);
    };

    // Command palette triggers
    onClick('btn-command-palette', () => openCommandPalette());
    window.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openCommandPalette();
      }
    });

    // Slash command (textarea)
    const ta = getTextarea();
    if (ta) {
      ta.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === '/') {
          const start = ta.selectionStart || 0;
          const value = ta.value;
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const before = value.substring(lineStart, start).trim();
          if (before === '') {
            // At line start ⇒ open palette
            e.preventDefault();
            openCommandPalette('');
          }
        }
      });
    }

    // Slash command (Monaco) — inline menu near cursor
    if (MonacoEditor.isReady()) {
      MonacoEditor.onKeyDown((e, ctx) => {
        const key = e.browserEvent?.key;
        if (key === '/') {
          const left = ctx.lineContent.slice(0, Math.max(ctx.column - 1, 0)).trim();
          if (left === '') {
            this.openSlashMenuAtCursor();
            return true;
          }
        }
        if (!this.slashActive) return;
        if (key === 'Escape') { this.closeSlashMenu(); return true; }
        if (key === 'ArrowDown' || key === 'ArrowUp') { this.navigateSlashMenu(key); return true; }
        if (key === 'Enter') { this.pickSlashMenuCommand(); return true; }
        // Update filter after the key applies to the buffer
        setTimeout(() => this.updateSlashMenuQueryMonaco(), 0);
      });
    }
  }

  private setupEditorModeToggle(): void {
    // Add editor mode toggle button to toolbar
    const toolbar = el('.border-b.border-neutral-200 .flex.items-center.justify-between > div:last-child');
    if (toolbar && MonacoEditor.isReady) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn-secondary btn-sm mr-2';
      toggleBtn.innerHTML = '<i class="fas fa-code"></i> Monaco';
      toggleBtn.title = 'Toggle Monaco Editor';
      toggleBtn.addEventListener('click', () => this.toggleEditorMode());
      
      toolbar.insertBefore(toggleBtn, toolbar.firstChild);
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N - New note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        this.createNewNote();
      }

      // Ctrl/Cmd + S - Save note
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveCurrentNote();
      }

      // Ctrl/Cmd + K - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = el('#search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Ctrl/Cmd + Shift + E - Toggle editor mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.toggleEditorMode();
      }
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      const notes = await Store.allNotes();
      
      // Build search index
      Search.buildIndex(notes);
      
      // Update note count
      this.updateNoteCount(notes.length);
      
      // Populate note list
      this.populateNoteList(notes);
      
      // Load first note or create new one
      if (notes.length > 0) {
        await this.loadNote(notes[0]);
      } else {
        this.createNewNote();
      }
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast('Failed to load notes', 'error');
    }
  }

  private showApplication(): void {
    const loadingScreen = el('#app-loading');
    const app = el('#app');
    const appReady = el('#app-ready');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (app) app.classList.remove('hidden');
    if (appReady) appReady.style.display = 'block';
  }

  private showErrorState(error: Error): void {
    const loadingScreen = el('#app-loading');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="text-center">
          <div class="mb-4 text-red-500">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h2 class="text-lg font-semibold text-red-800 mb-2">Application Error</h2>
          <p class="text-sm text-red-600 mb-4">${error.message}</p>
          <button onclick="location.reload()" class="btn-primary">
            Reload Application
          </button>
        </div>
      `;
    }
  }

  async createNewNote(): Promise<void> {
    try {
      const note: Note = {
        id: ULID(),
        title: '',
        body: '',
        tags: [],
        links: [],
        color: '#6B7280',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.loadNote(note);
      
      // Focus title input
      const titleInput = el('#note-title') as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
      }
      
      toast('New note created', 'success');
      
    } catch (error) {
      console.error('Failed to create new note:', error);
      toast('Failed to create note', 'error');
    }
  }

  async loadNote(note: Note): Promise<void> {
    try {
      this.currentNote = note;

      // Update title input
      const titleInput = el('#note-title') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = note.title || '';
      }

      // Update editor content
      if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
        MonacoEditor.setValue(note.body || '');
      } else {
        const bodyTextarea = el('#note-body') as HTMLTextAreaElement;
        if (bodyTextarea) {
          bodyTextarea.value = note.body || '';
        }
      }

      // Update preview
      this.updatePreview();

      // Update save status
      this.updateSaveStatus('Loaded');

    } catch (error) {
      console.error('Failed to load note:', error);
      toast('Failed to load note', 'error');
    }
  }

  private async saveCurrentNote(): Promise<void> {
    if (!this.currentNote) return;

    try {
      // Update note content
      const titleInput = el('#note-title') as HTMLInputElement;
      if (titleInput) {
        this.currentNote.title = titleInput.value.trim();
      }

      // Get body content from active editor
      if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
        this.currentNote.body = MonacoEditor.getValue();
      } else {
        const bodyTextarea = el('#note-body') as HTMLTextAreaElement;
        if (bodyTextarea) {
          this.currentNote.body = bodyTextarea.value;
        }
      }

      this.currentNote.updatedAt = new Date().toISOString();

      // Save to store
      await Store.upsert(this.currentNote);

      // Update search index
      const notes = await Store.allNotes();
      Search.buildIndex(notes);

      // Update note list
      this.populateNoteList(notes);
      this.updateNoteCount(notes.length);

      // Update save status
      this.updateSaveStatus('Saved');
      
      toast('Note saved successfully', 'success');

    } catch (error) {
      console.error('Failed to save note:', error);
      toast('Failed to save note', 'error');
      this.updateSaveStatus('Error');
    }
  }

  private updateNoteTitle(): void {
    if (!this.currentNote) return;
    
    const titleInput = el('#note-title') as HTMLInputElement;
    if (titleInput) {
      this.currentNote.title = titleInput.value.trim();
      this.scheduleAutoSave();
    }
  }

  private updateNoteBody(): void {
    if (!this.currentNote) return;
    
    // Get content from active editor
    let content = '';
    if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
      content = MonacoEditor.getValue();
    } else {
      const bodyTextarea = el('#note-body') as HTMLTextAreaElement;
      if (bodyTextarea) {
        content = bodyTextarea.value;
      }
    }
    
    this.currentNote.body = content;
    this.updatePreview();
    this.scheduleAutoSave();
  }

  private scheduleAutoSave(): void {
    if (!this.autoSaveEnabled) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.updateSaveStatus('Saving...');
    
    this.saveTimeout = window.setTimeout(() => {
      this.saveCurrentNote();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  private updatePreview(): void {
    const preview = el('#note-preview');
    if (preview && this.currentNote) {
      const body = this.currentNote.body || '';
      if (!body.trim()) {
        preview.innerHTML = '<p class="text-sm text-neutral-400">Start typing to see a live preview…</p>';
      } else {
        const rendered = renderMD(body);
        preview.innerHTML = rendered;
        this.ensureHeadingIds();
      }
      this.updateOutline();
    }
  }

  private ensureHeadingIds(): void {
    const previewPanel = el('#preview-panel') as HTMLElement | null;
    if (!previewPanel) return;
    const headings = previewPanel.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const used = new Set<string>();
    const slugify = (text: string) => (text || '')
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);
    headings.forEach(h => {
      const text = (h as HTMLElement).innerText || '';
      let base = slugify(text) || 'section';
      let id = base;
      let i = 2;
      while (used.has(id)) { id = `${base}-${i++}`; }
      used.add(id);
      if (!h.id) h.id = id;
    });
  }

  private updateOutline(): void {
    const list = el('#outline-list') as HTMLElement | null;
    const previewPanel = el('#preview-panel') as HTMLElement | null;
    const outlinePanel = el('#outline-panel') as HTMLElement | null;
    if (!list || !previewPanel || !outlinePanel || outlinePanel.classList.contains('hidden')) return;
    const headings = Array.from(previewPanel.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    if (headings.length === 0) {
      list.innerHTML = '<div class="text-xs text-neutral-400">No headings</div>';
      return;
    }
    const items = headings.map(h => {
      const level = parseInt(h.tagName.substring(1), 10);
      const indent = Math.max(0, level - 1);
      const text = h.innerText || '';
      const id = h.id;
      return `<button class="outline-item" data-target="${id}" style="padding-left:${indent * 12}px">${text}</button>`;
    }).join('');
    list.innerHTML = items;
    list.querySelectorAll('button[data-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = (e.currentTarget as HTMLElement).dataset.target;
        if (!targetId) return;
        const elTarget = previewPanel.querySelector(`#${CSS.escape(targetId)}`) as HTMLElement | null;
        if (elTarget) {
          // Smooth scroll inside preview panel
          const containerTop = (previewPanel.firstElementChild as HTMLElement)?.getBoundingClientRect().top || previewPanel.getBoundingClientRect().top;
          const rect = elTarget.getBoundingClientRect();
          const current = previewPanel.scrollTop;
          const offset = rect.top - containerTop + current - 8;
          previewPanel.scrollTo({ top: offset, behavior: 'smooth' });
        }
      });
    });
    this.bindOutlineScroll();
    this.highlightActiveOutline();
  }

  private toggleOutlinePanel(): void {
    const outlinePanel = el('#outline-panel') as HTMLElement | null;
    if (!outlinePanel) return;
    const hidden = outlinePanel.classList.toggle('hidden');
    if (!hidden) this.updateOutline();
  }

  private bindOutlineScroll(): void {
    const previewPanel = el('#preview-panel') as HTMLElement | null;
    if (!previewPanel) return;
    const prev = (this as any)._outlineScrollHandler;
    if (prev) previewPanel.removeEventListener('scroll', prev);
    const handler = () => this.highlightActiveOutline();
    (this as any)._outlineScrollHandler = handler;
    previewPanel.addEventListener('scroll', handler);
  }

  private highlightActiveOutline(): void {
    const previewPanel = el('#preview-panel') as HTMLElement | null;
    const list = el('#outline-list') as HTMLElement | null;
    if (!previewPanel || !list) return;
    const headings = Array.from(previewPanel.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    if (headings.length === 0) return;
    const containerTop = (previewPanel.firstElementChild as HTMLElement)?.getBoundingClientRect().top || previewPanel.getBoundingClientRect().top;
    const current = previewPanel.scrollTop;
    let activeId = headings[0].id;
    let minDelta = Infinity;
    headings.forEach(h => {
      const rect = h.getBoundingClientRect();
      const offset = rect.top - containerTop + current;
      const delta = Math.abs(offset - current - 16);
      if (offset - current <= 32 && delta < minDelta) {
        minDelta = delta;
        activeId = h.id;
      }
    });
    list.querySelectorAll('.outline-item').forEach(el => el.classList.remove('active'));
    const activeBtn = list.querySelector(`.outline-item[data-target="${CSS.escape(activeId)}"]`) as HTMLElement | null;
    if (activeBtn) activeBtn.classList.add('active');
  }

  private copyNoteLinkToClipboard(): void {
    if (!this.currentNote) { toast('No note selected', 'warning'); return; }
    const url = `${location.origin}${location.pathname}#/note/${encodeURIComponent(this.currentNote.id)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast('Note link copied', 'success')).catch(() => toast('Failed to copy link', 'error'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Note link copied', 'success'); } catch { toast('Failed to copy link', 'error'); }
      document.body.removeChild(ta);
    }
  }

  private openSlashMenuAtCursor(): void {
    if (!(MonacoEditor.isReady())) return;
    const pos = MonacoEditor.getPosition();
    const coords = MonacoEditor.getCursorCoords();
    if (!pos || !coords || !this.monacoContainer) return;

    this.closeSlashMenu();
    this.slashActive = true;
    this.slashLine = pos.lineNumber;
    this.slashStartCol = pos.column; // start after '/'
    this.slashSelectionIndex = 0;

    const elMenu = document.createElement('div');
    elMenu.id = 'slash-menu';
    elMenu.className = 'absolute z-50 min-w-[260px] rounded-lg border border-neutral-200 bg-white shadow-lg';
    elMenu.style.left = `${Math.round(coords.left)}px`;
    elMenu.style.top = `${Math.round(coords.top)}px`;
    this.monacoContainer.style.position = 'relative';
    this.monacoContainer.appendChild(elMenu);
    this.slashMenuEl = elMenu;
    this.renderSlashMenu();
  }

  private getSlashQueryText(): string {
    if (!this.slashActive || this.editorMode.type !== 'monaco' || !MonacoEditor.isReady()) return '';
    if (this.slashLine == null || this.slashStartCol == null) return '';
    const pos = MonacoEditor.getPosition();
    if (!pos || pos.lineNumber !== this.slashLine) return '';
    const line = MonacoEditor.getLineContent(this.slashLine) || '';
    const start = Math.max(this.slashStartCol, 1);
    const end = Math.max(Math.min(pos.column - 1, line.length), start);
    // Columns are 1-based; substring is 0-based and end-exclusive
    return line.substring(start - 1, end).trim();
  }

  private updateSlashMenuQueryMonaco(): void {
    if (!this.slashActive) return;
    this.renderSlashMenu();
  }

  private getSlashCommands() {
    // Mirror palette commands subset most relevant for inline
    return [
      { id: 'h1', label: 'Heading 1', run: () => this.applyHeading('#') },
      { id: 'h2', label: 'Heading 2', run: () => this.applyHeading('##') },
      { id: 'h3', label: 'Heading 3', run: () => this.applyHeading('###') },
      { id: 'bold', label: 'Bold', run: () => this.applyWrapInline('**','**') },
      { id: 'italic', label: 'Italic', run: () => this.applyWrapInline('*','*') },
      { id: 'check', label: 'Checklist', run: () => this.applyLinePrefixInline('- [ ]') },
      { id: 'quote', label: 'Quote', run: () => this.applyLinePrefixInline('>') },
      { id: 'code', label: 'Code Block', run: () => this.applyWrapInline('```\n','\n```') },
      { id: 'link', label: 'Link', run: () => this.applyWrapInline('[','](url)') },
      { id: 'wikilink', label: 'Wikilink', run: () => this.applyWrapInline('[[',']]') },
      { id: 'outline', label: 'Toggle Outline', run: () => this.toggleOutlinePanel() }
    ];
  }

  private renderSlashMenu(): void {
    if (!this.slashMenuEl) return;
    const q = this.getSlashQueryText().toLowerCase();
    const base = this.getSlashCommands();
    const scored = base.map(c => ({ c, s: this.fuzzyScore(c.label, q) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.c);
    const items = scored;
    if (this.slashSelectionIndex >= items.length) this.slashSelectionIndex = Math.max(items.length - 1, 0);
    const iconFor = (id: string) => ({ h1:'fa-heading', h2:'fa-heading', h3:'fa-heading', bold:'fa-bold', italic:'fa-italic', check:'fa-square', quote:'fa-quote-left', code:'fa-code', link:'fa-link', wikilink:'fa-bookmark', outline:'fa-list' } as Record<string,string>)[id] || 'fa-circle';
    this.slashMenuEl.innerHTML = (items.map((c, i) => `<div class="dropdown-item ${i===this.slashSelectionIndex?'bg-neutral-100':''}" data-idx="${i}"><i class="fas ${iconFor(c.id)} mr-2"></i>${c.label}</div>`).join('')) || '<div class="text-sm text-neutral-500 px-4 py-2">No commands</div>';
    this.slashMenuEl.querySelectorAll('[data-idx]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        this.slashSelectionIndex = parseInt((el as HTMLElement).dataset.idx || '0', 10);
        this.renderSlashMenu();
      });
      el.addEventListener('click', () => this.pickSlashMenuCommand());
    });
  }

  private navigateSlashMenu(key: string): void {
    const max = this.getSlashCommands().length - 1;
    if (key === 'ArrowDown') this.slashSelectionIndex = Math.min(this.slashSelectionIndex + 1, max);
    if (key === 'ArrowUp') this.slashSelectionIndex = Math.max(this.slashSelectionIndex - 1, 0);
    this.renderSlashMenu();
  }

  private pickSlashMenuCommand(): void {
    if (this.editorMode.type === 'monaco' && MonacoEditor.isReady() && this.slashLine && this.slashStartCol) {
      const pos = MonacoEditor.getPosition();
      if (pos) {
        const startCol = Math.max(this.slashStartCol - 1, 1);
        const endCol = pos.column;
        if (endCol >= startCol) {
          MonacoEditor.replaceRange(this.slashLine, startCol, this.slashLine, endCol, '');
        }
      }
    }
    const all = this.getSlashCommands();
    const q = this.getSlashQueryText();
    const scored = all.map(c => ({ c, s: this.fuzzyScore(c.label, q) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.c);
    const cmd = scored[this.slashSelectionIndex] || scored[0] || all[0];
    // Scaffolds: if query carries content, apply it smartly
    const rest = (q || '').trim();
    if (!cmd) { this.closeSlashMenu(); return; }
    if (cmd.id === 'h1' || cmd.id === 'h2' || cmd.id === 'h3') {
      // If rest contains text like "h2 Title" or just "Title"
      const text = rest.replace(/^h[1-3]\s*/i, '');
      this.applyHeading(cmd.id === 'h1' ? '#' : cmd.id === 'h2' ? '##' : '###');
      if (text) this.insertTextAtCursorInline(' ' + text);
    } else if (cmd.id === 'link') {
      // Support "title|url" scaffold
      const [title, url] = rest.split('|');
      if (title && url) {
        this.insertTextAtCursorInline(`[${title.trim()}](${url.trim()})`);
      } else {
        this.applyWrapInline('[', '](url)');
      }
    } else if (cmd.id === 'wikilink') {
      const title = rest.replace(/^wikilink\s*/i, '').trim();
      this.insertTextAtCursorInline(title ? `[[${title}]]` : '[[ ]]');
    } else if (cmd.id === 'code') {
      const lang = rest.replace(/^code\s*/i, '').trim();
      this.insertTextAtCursorInline('```' + (lang ? lang : '') + '\n\n```');
    } else {
      cmd.run();
    }
    this.closeSlashMenu();
  }

  private insertTextAtCursorInline(text: string): void {
    if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
      MonacoEditor.applyWrap(text, '');
      this.updateNoteBody();
      return;
    }
    const ta = el('#note-body') as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    ta.value = before + text + after;
    const pos = start + text.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    this.updateNoteBody();
  }

  private closeSlashMenu(): void {
    if (this.slashMenuEl && this.slashMenuEl.parentNode) this.slashMenuEl.parentNode.removeChild(this.slashMenuEl);
    this.slashMenuEl = null;
    this.slashActive = false;
    this.slashStartCol = null;
    this.slashLine = null;
    this.slashSelectionIndex = 0;
  }

  private applyWrapInline(prefix: string, suffix: string): void {
    if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
      MonacoEditor.applyWrap(prefix, suffix);
      this.updateNoteBody();
    } else {
      const ta = el('#note-body') as HTMLTextAreaElement;
      if (!ta) return;
      const start = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      const before = ta.value.slice(0, start);
      const sel = ta.value.slice(start, end);
      const after = ta.value.slice(end);
      ta.value = before + prefix + sel + suffix + after;
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = end + prefix.length;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      this.updateNoteBody();
    }
  }

  private applyLinePrefixInline(token: string): void {
    if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
      MonacoEditor.applyLinePrefix(token);
      this.updateNoteBody();
    } else {
      const ta = el('#note-body') as HTMLTextAreaElement;
      if (!ta) return;
      const start = ta.selectionStart || 0;
      const value = ta.value;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', start);
      const endPos = lineEnd === -1 ? value.length : lineEnd;
      const line = value.substring(lineStart, endPos);
      const newLine = line.startsWith(token) ? line : token + (line.startsWith(' ') ? '' : ' ') + line;
      ta.value = value.substring(0, lineStart) + newLine + value.substring(endPos);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      this.updateNoteBody();
    }
  }

  private applyHeading(token: string): void {
    this.applyLinePrefixInline(token);
  }

  private updateSaveStatus(status: string): void {
    const saveStatus = el('#save-status');
    if (saveStatus) {
      saveStatus.textContent = status;
      
      // Add visual indicator
      if (status === 'Saved') {
        saveStatus.className = 'text-sm text-green-600';
        setTimeout(() => {
          if (saveStatus) saveStatus.className = 'text-sm text-neutral-500';
        }, 2000);
      } else if (status === 'Error') {
        saveStatus.className = 'text-sm text-red-600';
      } else {
        saveStatus.className = 'text-sm text-neutral-500';
      }
    }
  }

  private async toggleEditorMode(): Promise<void> {
    if (!MonacoEditor.isReady()) {
      toast('Monaco Editor not available', 'warning');
      return;
    }

    try {
      const bodyTextarea = el('#note-body') as HTMLTextAreaElement;
      
      if (this.editorMode.type === 'textarea') {
        // Switch to Monaco
        const content = bodyTextarea?.value || '';
        
        if (this.monacoContainer) {
          // Hide textarea, show Monaco
          if (bodyTextarea) bodyTextarea.classList.add('hidden');
          this.monacoContainer.classList.remove('hidden');
          
          // Create Monaco editor
          await MonacoEditor.createEditor(this.monacoContainer, content);
          MonacoEditor.onChange((content) => this.updateNoteBody());
          
          this.editorMode.type = 'monaco';
          toast('Switched to Monaco Editor', 'success');
        }
      } else {
        // Switch to textarea
        const content = MonacoEditor.getValue();
        
        if (bodyTextarea && this.monacoContainer) {
          // Hide Monaco, show textarea
          this.monacoContainer.classList.add('hidden');
          bodyTextarea.classList.remove('hidden');
          bodyTextarea.value = content;
          
          // Destroy Monaco editor
          MonacoEditor.destroy();
          
          this.editorMode.type = 'textarea';
          toast('Switched to Textarea Editor', 'success');
        }
      }
      
    } catch (error) {
      console.error('Failed to toggle editor mode:', error);
      toast('Failed to switch editor mode', 'error');
    }
  }

  private toggleTheme(): void {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    
    // Update Monaco theme if active
    if (this.editorMode.type === 'monaco' && MonacoEditor.isReady()) {
      MonacoEditor.updateConfig({
        theme: newTheme === 'dark' ? 'vs-dark' : 'vs'
      });
    }
    
    toast(`Switched to ${newTheme} theme`, 'success');
  }

  private async performSearch(query: string): Promise<void> {
    if (!query.trim()) {
      // Show all notes when search is empty
      const notes = await Store.allNotes();
      this.populateNoteList(notes);
      return;
    }

    try {
      const results = Search.search(query, 20);
      const notes = results.map(r => r.note);
      this.populateNoteList(notes);
      
    } catch (error) {
      console.error('Search failed:', error);
      toast('Search failed', 'error');
    }
  }

  private async duplicateCurrentNote(): Promise<void> {
    if (!this.currentNote) { toast('No note selected', 'warning'); return; }
    try {
      const source = this.currentNote;
      const copy: Note = {
        id: ULID(),
        title: (source.title || 'Untitled') + ' (Copy)',
        body: source.body || '',
        tags: [...(source.tags || [])],
        links: [],
        color: source.color || '#6B7280',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await Store.upsert(copy);
      await this.loadNote(copy);
      const notes = await Store.allNotes();
      this.populateNoteList(notes);
      toast('Note duplicated', 'success');
    } catch (err) {
      console.error('Failed to duplicate note:', err);
      toast('Failed to duplicate note', 'error');
    }
  }

  private populateNoteList(notes: Note[]): void {
    const noteList = el('#note-list');
    if (!noteList) return;

    noteList.innerHTML = '';

    if (notes.length === 0) {
      noteList.innerHTML = '<p class="text-sm text-neutral-500 text-center py-4">No notes found</p>';
      return;
    }

    notes.forEach(note => {
      const noteItem = document.createElement('div');
      noteItem.className = 'p-3 rounded-lg hover:bg-neutral-100 cursor-pointer border border-transparent hover:border-neutral-200 transition-all';
      noteItem.dataset.testid = 'note-item';
      noteItem.innerHTML = `
        <h4 class="font-medium text-sm text-neutral-900 truncate">${note.title || 'Untitled'}</h4>
        <p class="text-xs text-neutral-600 mt-1 truncate">${note.body?.substring(0, 60) || 'No content'}...</p>
        <div class="flex items-center justify-between mt-2">
          <div class="flex gap-1">
            ${note.tags?.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
          </div>
          <span class="text-xs text-neutral-400">${new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      `;
      
      noteItem.addEventListener('click', () => this.loadNote(note));
      noteList.appendChild(noteItem);
    });
  }

  private updateNoteCount(count: number): void {
    const noteCountEl = el('#note-count');
    if (noteCountEl) {
      noteCountEl.textContent = `${count} note${count !== 1 ? 's' : ''}`;
    }
  }

  // Public API
  getCurrentNote(): Note | null {
    return this.currentNote;
  }

  getEditorMode(): EditorMode {
    return { ...this.editorMode };
  }
}

// Create and export application manager
const appManager = new ApplicationManager();

export const UI = {
  init: () => appManager.init(),
  getCurrentNote: () => appManager.getCurrentNote(),
  getEditorMode: () => appManager.getEditorMode(),
  createNewNote: () => appManager.createNewNote(),
  saveCurrentNote: () => appManager.saveCurrentNote()
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).UI = UI;
}
