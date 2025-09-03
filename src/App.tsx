import React from 'react';

// // 🤖 Review: This is a direct 1:1 translation of the existing HTML structure into a React component.
// All functionality is currently stripped. IDs, test-ids, and class names are preserved for future logic porting and to ensure E2E tests have their selectors.
// Inline styles have been converted to JSX style objects.

const App: React.FC = () => {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Loading Screen */}
      <div id="app-loading">
          <div className="loading-content">
              <div className="spinner"></div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>Loading Mahart Notes</h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Initializing your knowledge workspace...</p>
          </div>
      </div>

      {/* Main Application Container */}
      <div id="app" className="hidden">
          {/* Sidebar Navigation */}
          <nav id="sidebar" data-testid="sidebar" role="navigation" aria-label="Primary">
              {/* Sidebar Header */}
              <header className="sidebar-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                      <h1>Mahart Notes</h1>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          {/* Sync Status Indicator */}
                          <div id="sync-status" style={{ width: '8px', height: '8px', background: 'var(--color-accent-success)', borderRadius: '50%', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} title="Application status"></div>
                          {/* Menu Toggle for Mobile */}
                          <button id="mobile-menu-toggle" data-testid="mobile-menu-toggle" className="btn btn-ghost btn-icon lg:hidden">
                              <i className="fas fa-bars"></i>
                          </button>
                      </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="quick-actions">
                      <button id="new-note-btn" data-testid="new-note-btn" className="btn btn-primary" style={{ flex: 1 }}>
                          <i className="fas fa-plus"></i>
                          <span>New Note</span>
                      </button>
                      <button id="search-toggle-btn" className="btn btn-secondary btn-icon">
                          <i className="fas fa-search"></i>
                      </button>
                  </div>
                  
                  {/* Search Bar */}
                  <div id="search-container" className="search-container">
                      <div className="search-input-wrapper">
                          <i className="search-icon fas fa-search"></i>
                          <input 
                              type="text" 
                              id="search-input" 
                              data-testid="search-input"
                              className="search-input" 
                              placeholder="Search notes... (⌘K)"
                          />
                      </div>
                      <div id="search-results" data-testid="search-results" className="search-results hidden"></div>
                  </div>
              </header>
              
              {/* Navigation Menu */}
              <div className="sidebar-body">
                  <nav className="sidebar-nav">
                      <a href="#/" data-route="#/" className="sidebar-nav-item">
                          <i className="fas fa-edit"></i>
                          <span>Editor</span>
                          <kbd>⌘E</kbd>
                      </a>
                      <a href="#/graph" data-route="#/graph" className="sidebar-nav-item">
                          <i className="fas fa-project-diagram"></i>
                          <span>Knowledge Graph</span>
                          <kbd>⌘G</kbd>
                      </a>
                      <a href="#/tags" data-route="#/tags" className="sidebar-nav-item">
                          <i className="fas fa-tags"></i>
                          <span>Tag Management</span>
                          <kbd>⌘T</kbd>
                      </a>
                      <a href="#/ai" data-route="#/ai" className="sidebar-nav-item">
                          <i className="fas fa-brain"></i>
                          <span>AI Assistant</span>
                          <kbd>⌘A</kbd>
                      </a>
                      <a href="#/settings" data-route="#/settings" className="sidebar-nav-item">
                          <i className="fas fa-cog"></i>
                          <span>Settings</span>
                      </a>
                  </nav>
                  
                  {/* Note List */}
                  <div>
                      <div className="note-list-header">
                          <h3 className="note-list-title">Notes</h3>
                          <span id="note-count" data-testid="note-count" className="note-count">0 notes</span>
                      </div>
                      <div id="note-list" data-testid="note-list" className="note-list">
                          {/* Note items will be populated here */}
                      </div>
                  </div>
              </div>
              
              {/* Sidebar Footer */}
              <footer className="sidebar-footer">
                  <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      <div style={{ marginBottom: 'var(--space-xs)' }}>v2.0.0</div>
                      <button id="theme-toggle" className="btn btn-ghost btn-sm">
                          <i className="fas fa-palette"></i>
                          <span>Theme</span>
                      </button>
                  </div>
              </footer>
          </nav>

          {/* Main Content Area */}
          <main id="main-content" className="flex-1 flex flex-col overflow-hidden" role="main">
              {/* Editor Page */}
              <div id="page-editor" className="page active">
                  {/* Editor Header */}
                  <div className="editor-header">
                      <div className="editor-title-section">
                          <input 
                              type="text" 
                              id="note-title" 
                              data-testid="note-title"
                              className="note-title-input" 
                              placeholder="Untitled Note"
                          />
                      </div>
                      <div className="editor-actions">
                          <span id="save-status" className="save-status" aria-live="polite" aria-atomic="true"></span>
                          <button id="save-btn" className="btn btn-primary btn-sm">
                              <i className="fas fa-save"></i>
                              <span>Save</span>
                          </button>
                      </div>
                  </div>
                  {/* Editor Toolbar */}
                  <div className="editor-toolbar">
                      <button id="btn-bold" className="btn btn-sm" title="Bold (Ctrl+B)"><i className="fas fa-bold"></i></button>
                      <button id="btn-italic" className="btn btn-sm" title="Italic (Ctrl+I)"><i className="fas fa-italic"></i></button>
                      <div style={{ width: '1px', height: '20px', background: 'var(--color-border-primary)', margin: '0 var(--space-xs)' }}></div>
                      <button id="btn-h1" className="btn btn-sm" title="Heading 1"><span style={{ fontWeight: 'var(--font-weight-semibold)' }}>H1</span></button>
                      <button id="btn-h2" className="btn btn-sm" title="Heading 2"><span style={{ fontWeight: 'var(--font-weight-semibold)' }}>H2</span></button>
                      <button id="btn-h3" className="btn btn-sm" title="Heading 3"><span style={{ fontWeight: 'var(--font-weight-semibold)' }}>H3</span></button>
                      <div style={{ width: '1px', height: '20px', background: 'var(--color-border-primary)', margin: '0 var(--space-xs)' }}></div>
                      <button id="btn-link" className="btn btn-sm" title="Link"><i className="fas fa-link"></i></button>
                      <button id="btn-wikilink" className="btn btn-sm" title="Wikilink"><i className="fas fa-bookmark"></i></button>
                      <button id="btn-check" className="btn btn-sm" title="Checklist"><i className="fas fa-square"></i></button>
                      <button id="btn-code" className="btn btn-sm" title="Code block"><i className="fas fa-code"></i></button>
                      <button id="btn-quote" className="btn btn-sm" title="Quote"><i className="fas fa-quote-left"></i></button>
                      <button id="btn-highlight" className="btn btn-sm" title="Highlight selected text"><i className="fas fa-highlighter"></i></button>
                      <div style={{ width: '1px', height: '20px', background: 'var(--color-border-primary)', margin: '0 var(--space-xs)' }}></div>
                      <button id="btn-toggle-preview" className="btn btn-sm" title="Show/Hide Preview"><i className="fas fa-eye"></i></button>
                      <button id="btn-toggle-editor-mode" className="btn btn-sm" title="Switch Editor Mode"><i className="fas fa-pen"></i></button>
                      <button id="btn-outline" className="btn btn-sm" title="Toggle Outline"><i className="fas fa-list"></i></button>
                      <button id="btn-command-palette" className="btn btn-sm" title="Command Palette (⌘⇧P)"><i className="fas fa-terminal"></i></button>
                  </div>
                      
                  {/* Editor Content */}
                  <div className="editor-content">
                      {/* Editor Panel */}
                      <div className="editor-pane">
                          <textarea 
                              id="note-body" 
                              data-testid="note-body"
                              className="editor-textarea" 
                              placeholder="Start writing your note..."
                          ></textarea>
                      </div>
                      
                      {/* Splitter */}
                      <div id="editor-splitter" className="editor-splitter" role="separator" aria-label="Resize editor/preview" aria-orientation="vertical" tabIndex={0}></div>
                      
                      {/* Preview Panel */}
                      <div id="preview-panel" className="preview-pane">
                          <div className="preview-content">
                              <div id="note-preview" data-testid="note-preview" className="preview">
                                  {/* Rendered markdown preview */}
                              </div>
                          </div>
                      </div>

                      {/* Outline Panel */}
                      <aside id="outline-panel" className="hidden" style={{ width: '256px', borderLeft: '1px solid var(--color-border-primary)', background: 'var(--color-bg-secondary)', overflowY: 'auto' }}>
                          <div style={{ padding: 'var(--space-md)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>Outline <span id="outline-count" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-xs)' }}>0</span></h3>
                              </div>
                              <nav id="outline-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}></nav>
                          </div>
                      </aside>
                  </div>
              </div>

              {/* Graph Page */}
              <div id="page-graph" className="page">
                  <div id="graph-container" data-testid="graph-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <svg id="graph-svg" style={{ width: '100%', height: '100%' }}></svg>
                      <div className="graph-controls">
                          <button className="btn btn-sm" title="Toggle Link Mode"><i className="fas fa-exchange-alt"></i></button>
                          <button className="btn btn-sm" title="Center Graph"><i className="fas fa-compress-arrows-alt"></i></button>
                          <button className="btn btn-sm" title="Reset Zoom"><i className="fas fa-search-minus"></i></button>
                      </div>
                      <div className="graph-legend">
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}>Legend</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Nodes: Notes • Links: Connections</div>
                      </div>
                  </div>
              </div>

              {/* Tags Page */}
              <div id="page-tags" className="page" style={{ padding: 'var(--space-xl)' }}>
                  <div data-testid="tags-container">
                      <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-xl)' }}>Tag Management</h2>
                      <div className="card">
                          <div className="card-header">
                              <h3 className="card-title">All Tags</h3>
                          </div>
                          <div className="card-body">
                              <div id="tag-list" data-testid="tag-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                                  {/* Tags will be populated here */}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* AI Page */}
              <div id="page-ai" className="page" style={{ padding: 'var(--space-xl)' }}>
                  <div>
                      <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-xl)' }}>AI Assistant</h2>
                      <div className="card">
                          <div className="card-header">
                              <h3 className="card-title">AI Chat</h3>
                          </div>
                          <div className="card-body">
                              <div id="ai-chat-container" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                  <div id="ai-messages" style={{ flex: 1, marginBottom: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)' }}>
                                      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Start a conversation with your AI assistant...</p>
                                  </div>
                                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                      <input type="text" id="ai-input" className="form-input" placeholder="Ask me anything about your notes..." style={{ flex: 1 }} />
                                      <button id="ai-send" className="btn btn-primary">
                                          <i className="fas fa-paper-plane"></i>
                                          <span>Send</span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Settings Page */}
              <div id="page-settings" className="page" style={{ padding: 'var(--space-xl)' }}>
                  <div>
                      <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-xl)' }}>Settings</h2>
                      <div style={{ maxWidth: '600px' }}>
                          <div className="card">
                              <div className="card-header">
                                  <h3 className="card-title">Preferences</h3>
                              </div>
                              <div className="card-body">
                                  <div className="form-group">
                                      <label className="form-label">Theme</label>
                                      <select id="theme-select" className="form-select">
                                          <option value="dark">Dark</option>
                                          <option value="light">Light</option>
                                          <option value="system">System</option>
                                      </select>
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                                      <button id="export-btn" data-testid="export-btn" className="btn btn-secondary">
                                          <i className="fas fa-download"></i>
                                          <span>Export Data</span>
                                      </button>
                                      <button id="import-btn" className="btn btn-secondary">
                                          <i className="fas fa-upload"></i>
                                          <span>Import Data</span>
                                      </button>
                                  </div>
                                  
                                  <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: 'var(--space-lg)' }}>
                                      <button id="clear-data-btn" data-testid="clear-data-btn" className="btn btn-error">
                                          <i className="fas fa-trash"></i>
                                          <span>Clear All Data</span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </main>
      </div>

      {/* Mobile Menu Overlay */}
      <div id="mobile-menu" data-testid="mobile-menu" className="fixed inset-0 z-40 lg:hidden hidden">
          <div className="modal-backdrop"></div>
          <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform">
              {/* Mobile menu content will be populated here */}
          </nav>
      </div>

      {/* Toast Notifications */}
      <div id="toast-container" className="fixed bottom-4 right-4 z-50 space-y-2">
          <div id="toast" className="toast hidden">
              <div id="toast-content"></div>
          </div>
      </div>

      {/* Modals */}
      <div id="modal-container" className="hidden">
          {/* Modals will be rendered here */}
      </div>

      {/* App Ready Indicator for Testing */}
      <div id="app-ready" data-testid="app-ready" style={{ display: 'none' }}></div>

      <noscript>
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#7f1d1d', textAlign: 'center' }}>
              JavaScript is required to run Mahart Linked Notes.
          </div>
      </noscript>
    </>
  );
};

export default App;
