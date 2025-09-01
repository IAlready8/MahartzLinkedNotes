// Monaco Editor Integration Module
import * as monaco from 'monaco-editor';
import type { Note } from '../types/index.js';
import { debounce } from './util.js';

interface EditorConfig {
  theme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  fontSize: number;
  lineNumbers: 'on' | 'off' | 'relative';
  wordWrap: 'on' | 'off' | 'bounded';
  minimap: boolean;
  folding: boolean;
  lineHeight: number;
  fontFamily: string;
}

class MonacoEditorManager {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private container: HTMLElement | null = null;
  private currentNote: Note | null = null;
  private onChangeCallback: ((content: string) => void) | null = null;
  private isInitialized = false;
  private config: EditorConfig = {
    theme: 'vs',
    fontSize: 14,
    lineNumbers: 'on',
    wordWrap: 'on',
    minimap: false,
    folding: true,
    lineHeight: 21,
    fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace'
  };

  /**
   * Initialize Monaco Editor
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure Monaco environment
      this.configureMonaco();
      
      // Register custom languages and themes
      this.registerCustomLanguages();
      this.registerCustomThemes();
      
      this.isInitialized = true;
      console.log('✅ Monaco Editor initialized');
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      throw error;
    }
  }

  /**
   * Configure Monaco Editor environment
   */
  private configureMonaco(): void {
    // Configure worker paths for Vite
    (self as any).MonacoEnvironment = {
      getWorkerUrl: function (workerId: string, label: string) {
        if (label === 'json') {
          return new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url).href;
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url).href;
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url).href;
        }
        if (label === 'typescript' || label === 'javascript') {
          return new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url).href;
        }
        return new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url).href;
      }
    };
  }

  /**
   * Register custom languages for note-taking
   */
  private registerCustomLanguages(): void {
    // Register enhanced markdown language
    monaco.languages.register({ id: 'enhanced-markdown' });

    // Define enhanced markdown language with wikilinks and tags
    monaco.languages.setMonarchTokensProvider('enhanced-markdown', {
      tokenizer: {
        root: [
          // Headers
          [/^#{1,6}\s.*$/, 'markup.heading'],
          
          // Wikilinks
          [/\[\[[^\]]*\]\]/, 'entity.name.tag'],
          
          // Tags
          [/#[a-zA-Z0-9_-]+/, 'variable.other'],

          
          
          // Bold
          [/\*\*[^*]+\*\*/, 'markup.bold'],
          [/__[^_]+__/, 'markup.bold'],
          
          // Italic
          [/\*[^*]+\*/, 'markup.italic'],
          [/_[^_]+_/, 'markup.italic'],
          
          // Code
          [/`[^`]+`/, 'string.other'],
          
          // Links
          [/\[([^\]]+)\]\(([^)]+)\)/, 'markup.underline.link'],
          
          // Lists
          [/^\s*[-*+]\s/, 'markup.list'],
          [/^\s*\d+\.\s/, 'markup.list'],
          
          // Blockquotes
          [/^\s*>.*$/, 'comment'],
          
          // Code blocks
          [/^```[\s\S]*?^```$/m, 'string.other'],
        ]
      }
    });

    // Register completion provider for wikilinks and tags
    monaco.languages.registerCompletionItemProvider('enhanced-markdown', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions: monaco.languages.CompletionItem[] = [];

        // Add wikilink suggestions
        if (word.word.startsWith('[[')) {
          // In a real implementation, this would get note titles from the store
          suggestions.push({
            label: '[[Example Note]]',
            kind: monaco.languages.CompletionItemKind.Reference,
            insertText: '[[Example Note]]',
            range: range,
            documentation: 'Link to Example Note'
          });
        }

        // Add tag suggestions
        if (word.word.startsWith('#')) {
          const commonTags = ['#project', '#idea', '#todo', '#important', '#research'];
          commonTags.forEach(tag => {
            suggestions.push({
              label: tag,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: tag,
              range: range
            });
          });
        }

        return { suggestions };
      }
    });
  }

  /**
   * Register custom themes
   */
  private registerCustomThemes(): void {
    // Define a custom dark theme
    monaco.editor.defineTheme('mahart-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'markup.heading', foreground: '#3b82f6', fontStyle: 'bold' },
        { token: 'entity.name.tag', foreground: '#10b981', fontStyle: 'underline' },
        { token: 'variable.other', foreground: '#f59e0b' },
        { token: 'markup.bold', fontStyle: 'bold' },
        { token: 'markup.italic', fontStyle: 'italic' },
        { token: 'string.other', foreground: '#84cc16' },
        { token: 'markup.underline.link', foreground: '#06b6d4', fontStyle: 'underline' },
        { token: 'comment', foreground: '#6b7280', fontStyle: 'italic' }
      ],
      colors: {
        'editor.background': '#1e293b',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#334155',
        'editor.inactiveSelectionBackground': '#1e293b'
      }
    });

    // Define a custom light theme
    monaco.editor.defineTheme('mahart-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'markup.heading', foreground: '#1d4ed8', fontStyle: 'bold' },
        { token: 'entity.name.tag', foreground: '#059669', fontStyle: 'underline' },
        { token: 'variable.other', foreground: '#d97706' },
        { token: 'markup.bold', fontStyle: 'bold' },
        { token: 'markup.italic', fontStyle: 'italic' },
        { token: 'string.other', foreground: '#65a30d' },
        { token: 'markup.underline.link', foreground: '#0891b2', fontStyle: 'underline' },
        { token: 'comment', foreground: '#6b7280', fontStyle: 'italic' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e293b'
      }
    });
  }

  /**
   * Create Monaco Editor instance
   */
  async createEditor(container: HTMLElement, initialContent: string = ''): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    this.container = container;

    // Create editor
    this.editor = monaco.editor.create(container, {
      value: initialContent,
      language: 'enhanced-markdown',
      theme: this.config.theme === 'vs-dark' ? 'mahart-dark' : 'mahart-light',
      fontSize: this.config.fontSize,
      lineNumbers: this.config.lineNumbers,
      wordWrap: this.config.wordWrap,
      minimap: { enabled: this.config.minimap },
      folding: this.config.folding,
      lineHeight: this.config.lineHeight,
      fontFamily: this.config.fontFamily,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: 'active'
      },
      suggest: {
        showKeywords: true,
        showSnippets: true
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      }
    });

    // Setup change listener
    const debouncedOnChange = debounce((content: string) => {
      if (this.onChangeCallback) {
        this.onChangeCallback(content);
      }
    }, 300);

    this.editor.onDidChangeModelContent(() => {
      const content = this.editor?.getValue() || '';
      debouncedOnChange(content);
    });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Expose basic onKeyDown for external features (e.g., slash commands)
    this.editor.onKeyDown((e) => {
      if (!this.editor) return;
      if (typeof (this as any)._onKeyDownCallback === 'function') {
        const position = this.editor.getPosition();
        const model = this.editor.getModel();
        const lineNumber = position?.lineNumber || 1;
        const column = position?.column || 1;
        const lineContent = model?.getLineContent(lineNumber) || '';
        const handled = (this as any)._onKeyDownCallback(e, { lineNumber, column, lineContent });
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });

    console.log('Monaco Editor created successfully');
  }

  /**
   * Setup custom keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    if (!this.editor) return;

    // Bold text
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      this.wrapSelection('**', '**');
    });

    // Italic text
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      this.wrapSelection('*', '*');
    });

    // Create link
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      this.wrapSelection('[', '](url)');
    });

    // Create wikilink
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
      this.wrapSelection('[[', ']]');
    });
  }

  /**
   * Wrap selected text with prefix and suffix
   */
  private wrapSelection(prefix: string, suffix: string): void {
    if (!this.editor) return;

    const selection = this.editor.getSelection();
    if (!selection) return;

    const selectedText = this.editor.getModel()?.getValueInRange(selection) || '';
    const wrappedText = `${prefix}${selectedText}${suffix}`;

    this.editor.executeEdits('wrap-selection', [{
      range: selection,
      text: wrappedText
    }]);

    // Update selection to be inside the wrapped text
    const newSelection = new monaco.Selection(
      selection.startLineNumber,
      selection.startColumn + prefix.length,
      selection.endLineNumber,
      selection.endColumn + prefix.length
    );
    this.editor.setSelection(newSelection);
  }

  /**
   * Public: Wrap current selection (used by toolbar)
   */
  public applyWrap(prefix: string, suffix: string): void {
    this.wrapSelection(prefix, suffix);
  }

  /**
   * Public: Add token at start of selected lines
   */
  public applyLinePrefix(token: string): void {
    if (!this.editor) return;
    const model = this.editor.getModel();
    const selection = this.editor.getSelection();
    if (!model || !selection) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
    for (let line = startLine; line <= endLine; line++) {
      const content = model.getLineContent(line);
      if (content.startsWith(token)) continue;
      const insertText = content.startsWith(' ') ? token : token + ' ';
      edits.push({
        range: new monaco.Range(line, 1, line, 1),
        text: insertText
      });
    }
    if (edits.length > 0) {
      this.editor.executeEdits('line-prefix', edits);
    }
  }

  /** Get current cursor position */
  public getPosition(): monaco.Position | null {
    return this.editor?.getPosition() || null;
  }

  /** Get content of a given line */
  public getLineContent(lineNumber: number): string {
    const model = this.editor?.getModel();
    return model ? model.getLineContent(lineNumber) : '';
  }

  /** Get cursor coordinates relative to the editor container */
  public getCursorCoords(): { left: number; top: number } | null {
    if (!this.editor || !this.container) return null;
    const pos = this.editor.getPosition();
    if (!pos) return null;
    const coords = (this.editor as any).getScrolledVisiblePosition(pos);
    if (!coords) return null;
    return { left: coords.left + 8, top: coords.top + coords.height + 4 };
  }

  /** Replace a range with text */
  public replaceRange(startLine: number, startColumn: number, endLine: number, endColumn: number, text: string): void {
    if (!this.editor) return;
    const range = new monaco.Range(startLine, startColumn, endLine, endColumn);
    this.editor.executeEdits('replace-range', [{ range, text }]);
  }

  /** Register external onKeyDown callback (returns true if handled) */
  public onKeyDown(cb: (e: monaco.IKeyboardEvent, ctx: { lineNumber: number; column: number; lineContent: string }) => boolean | void) {
    (this as any)._onKeyDownCallback = cb;
  }

  /**
   * Set editor content
   */
  setValue(content: string): void {
    if (this.editor) {
      this.editor.setValue(content);
    }
  }

  /**
   * Get editor content
   */
  getValue(): string {
    return this.editor?.getValue() || '';
  }

  /**
   * Set change callback
   */
  onChange(callback: (content: string) => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * Update editor configuration
   */
  updateConfig(newConfig: Partial<EditorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.editor) {
      this.editor.updateOptions({
        theme: this.config.theme === 'vs-dark' ? 'mahart-dark' : 'mahart-light',
        fontSize: this.config.fontSize,
        lineNumbers: this.config.lineNumbers,
        wordWrap: this.config.wordWrap,
        minimap: { enabled: this.config.minimap },
        folding: this.config.folding,
        lineHeight: this.config.lineHeight,
        fontFamily: this.config.fontFamily
      });
    }
  }

  /**
   * Focus the editor
   */
  focus(): void {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Resize the editor
   */
  resize(): void {
    if (this.editor) {
      this.editor.layout();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EditorConfig {
    return { ...this.config };
  }

  /**
   * Destroy the editor
   */
  destroy(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.container = null;
    this.currentNote = null;
    this.onChangeCallback = null;
  }

  /**
   * Check if editor is ready
   */
  isReady(): boolean {
    return this.editor !== null;
  }
}

// Create and export Monaco Editor manager
const monacoManager = new MonacoEditorManager();

export const MonacoEditor = {
  init: () => monacoManager.init(),
  createEditor: (container: HTMLElement, content?: string) => monacoManager.createEditor(container, content),
  setValue: (content: string) => monacoManager.setValue(content),
  getValue: () => monacoManager.getValue(),
  onChange: (callback: (content: string) => void) => monacoManager.onChange(callback),
  onKeyDown: (cb: (e: monaco.IKeyboardEvent, ctx: { lineNumber: number; column: number; lineContent: string }) => boolean | void) => monacoManager.onKeyDown(cb),
  applyWrap: (prefix: string, suffix: string) => monacoManager.applyWrap(prefix, suffix),
  applyLinePrefix: (token: string) => monacoManager.applyLinePrefix(token),
  updateConfig: (config: Partial<EditorConfig>) => monacoManager.updateConfig(config),
  focus: () => monacoManager.focus(),
  resize: () => monacoManager.resize(),
  getConfig: () => monacoManager.getConfig(),
  destroy: () => monacoManager.destroy(),
  isReady: () => monacoManager.isReady(),
  getPosition: () => monacoManager.getPosition(),
  getLineContent: (line: number) => monacoManager.getLineContent(line),
  getCursorCoords: () => monacoManager.getCursorCoords()
  , replaceRange: (sl: number, sc: number, el: number, ec: number, text: string) => monacoManager.replaceRange(sl, sc, el, ec, text)
};
