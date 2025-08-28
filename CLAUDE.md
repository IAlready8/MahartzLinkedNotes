# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mahart Linked Notes is an advanced client-side knowledge management platform that runs entirely in the browser without requiring a server. It has evolved far beyond a basic Zettelkasten into a comprehensive unified platform featuring AI assistance, collaboration tools, advanced analytics, plugin architecture, and enterprise-grade features. The application implements sophisticated note-taking with wikilinks, bidirectional backlinks, enhanced tag management, full-text search, force-directed graph visualization, and many advanced features.

## Development Commands

### Running the Application
```bash
# Serve via local web server (recommended for development)
npm run dev
# This runs: python3 -m http.server 8000
# Then open http://localhost:8000

# Alternative: Open directly in browser (basic functionality)
open index.html
```

### Testing the Application
```bash
# No automated tests currently exist
# Manual testing: Open index.html in browser and verify:
# 1. Note creation/editing works
# 2. Wikilinks resolve correctly ([[Note Title]] and [[ID:xxxx]])  
# 3. Tags display and filter properly
# 4. Search returns relevant results
# 5. Graph visualization renders with both link modes
# 6. Color picker assigns and persists colors
# 7. Page navigation works via sidebar links
# 8. Graph mode toggle switches between tag/color linking
# 9. Multi-tab sync works (open multiple tabs)
# 10. Export/import preserves data and colors
```

### Keyboard Shortcuts
```bash
# Core Navigation
⌘/Ctrl+K     # Quick search with suggestions
⌘/Ctrl+N     # Create new note
⌘/Ctrl+S     # Save current note
⌘/Ctrl+P     # Open command palette (advanced UI)

# Advanced Editor Features  
⌘/Ctrl+H     # Show version history
⌘/Ctrl+F     # Find/replace in editor
⌘/Ctrl+D     # Toggle distraction-free mode

# Theme and UI
⌘/Ctrl+Shift+T # Cycle themes
```

### CSS Development
```bash
# Watch and rebuild CSS during development
npm run build-css
# This runs: tailwindcss -i ./css/tailwind-input.css -o ./css/tailwind-output.css --watch

# Build minified CSS for production
npm run build-css-prod
# This runs: tailwindcss -i ./css/tailwind-input.css -o ./css/tailwind-output.css --minify
```

### Development Tools
```bash
# Enable browser dev tools for debugging
# Key debugging areas:
# - IndexedDB inspection (Application tab in Chrome DevTools)
# - Console errors during note operations
# - Performance timing in the Performance panel
# - Network tab should show no requests (pure client-side app)
# - BroadcastChannel messages for multi-tab sync
```

## Core Architecture

### Router-Based SPA Architecture
The application uses a client-side router with page-based architecture:

- **Router Layer** (`router.js`): Hash-based navigation system managing page transitions
- **UI Layer** (`app.js`): Page-specific event handling and modular initialization
- **Data Layer** (`store.js`): IndexedDB persistence via localforage, CRUD operations, import/export
- **Feature Modules**: Search engine, graph visualization, analytics, tag management

### Page Structure
- **Editor Page** (`#/`): Main note editing interface with sidebar note list
- **Graph Page** (`#/graph`): Knowledge graph visualization with dual linking modes
- **Tags Page** (`#/tags`): Tag management and organization interface
- **AI Page** (`#/ai`): AI assistant interface
- **Settings Page** (`#/settings`): Application preferences and configuration

### Data Flow
```
User Action → UI Event Handler → Data Store Operation → Refresh UI Components
```

### Key Data Model
```javascript
Note: {
  id: string,        // ULID-based identifier
  title: string,     // Note title  
  body: string,      // Markdown content
  tags: string[],    // Normalized hashtags (#tag format)
  links: string[],   // Computed array of linked note IDs
  color: string,     // Hex color code for visual organization (default: '#6B7280')
  createdAt: string, // ISO timestamp
  updatedAt: string  // ISO timestamp
}
```

## Critical Implementation Details

### Wikilink System
- **Two formats**: `[[Note Title]]` (resolved by title) and `[[ID:xxxx]]` (direct ID reference)
- **Auto-creation**: Clicking unresolved title links creates new notes
- **Link computation**: Happens on save and refresh, stored in `note.links` array
- **Backlinks**: Automatically computed by scanning all notes for incoming links

### Tag Management
The enhanced tag system (in `tags.js`) provides:
- **8 predefined categories** with color coding (content, method, project, meta, domain, status, priority, source)
- **Smart suggestions** based on content analysis
- **Bulk operations** for multiple notes
- **Statistics and analytics** for tag usage patterns

### Search Implementation
- **Token-based scoring**: Content matches +1 point, title matches +2 points
- **Real-time indexing**: Search index rebuilt on every data change
- **Debounced input**: 120ms delay to prevent excessive recomputation
- **Comprehensive scope**: Searches title, tags, and body content

### Graph Visualization
- **D3.js force simulation**: Physics-based node positioning
- **Dual linking modes**: Tag-based (wikilinks/shared tags) and color-based (shared colors)
- **Node coloring**: Uses assigned note colors or falls back to connection-based coloring
- **Interactive**: Drag nodes, click to open notes, toggle between link modes
- **Performance**: Optimized for ~100-500 notes

### Storage Strategy
- **LocalForage**: IndexedDB wrapper with localStorage fallback
- **Full-table operations**: All notes loaded into memory for cross-referencing
- **Atomic updates**: Individual note upserts maintain consistency
- **Multi-tab sync**: BroadcastChannel API for real-time synchronization

## File Structure

```
/
├── index.html              # Multi-page SPA with Tailwind CSS and clean sidebar navigation
├── css/styles.css          # Combined Tailwind output and custom styles
├── js/
│   ├── router.js          # Client-side hash-based router for SPA navigation
│   ├── app.js             # Page-specific UI orchestration and event handling
│   ├── store.js           # Data persistence and CRUD operations with color support
│   ├── search.js          # Full-text search with token scoring
│   ├── graph.js           # D3-based visualization with dual linking modes
│   ├── analytics.js       # Performance monitoring and usage metrics
│   ├── tags.js            # Enhanced tag management with categories
│   ├── util.js            # Common utilities (debounce, DOM helpers, etc.)
│   ├── init.js            # Application initialization and module loading
│   └── [advanced modules] # 20+ feature modules for extended functionality
├── data/
│   ├── meta.json          # Application metadata
│   └── claude_prompts.md  # Development prompts and context
└── README.md              # Basic project documentation
```

## Dependencies

### Development Dependencies (package.json)
- **TailwindCSS**: Utility-first CSS framework with typography and forms plugins
- **@tailwindcss/typography**: Rich text styling for rendered markdown
- **@tailwindcss/forms**: Consistent form styling across browsers

### Runtime Dependencies (CDN)
The application loads modern libraries from CDN for enhanced functionality:
- **LocalForage**: IndexedDB wrapper with localStorage fallback
- **Marked.js**: Markdown parsing and rendering
- **DOMPurify**: XSS protection for rendered content  
- **Chart.js**: Analytics charts and data visualization
- **D3.js**: Force-directed graph visualization and network analysis
- **ULID**: Unique lexicographically sortable identifiers

## Development Guidelines

### Adding New Features
1. **Follow modular pattern**: Create new files for substantial features, extend existing modules for enhancements
2. **Conditional loading**: Use `typeof ModuleName !== 'undefined'` checks before calling module functions
3. **Maintain data consistency**: Always recompute links after note modifications
4. **Update search index**: Call `Search.buildIndex()` after data changes
5. **Preserve multi-tab sync**: Use BroadcastChannel for cross-tab notifications
6. **Error handling**: Wrap async operations in try-catch blocks
7. **Performance**: All operations must work with 100+ notes loaded in memory
8. **Progressive enhancement**: Ensure core functionality works even if advanced modules fail to load

### Working with Tags
- **Use TagManager utility**: Provides categorization, color coding, and smart suggestions
- **Maintain normalization**: Tags should be lowercase with # prefix
- **Update UI components**: Both sidebar tag list and enhanced input need refresh after changes
- **Respect categories**: Use predefined categories for consistency

### Modifying Search
- **Token-based approach**: Search works on space-separated tokens, not full-text matching
- **Scoring system**: Title matches weighted higher than body matches
- **Index rebuilding**: Required after any note content changes
- **Performance**: Consider debouncing for real-time search inputs

### Graph Visualization Changes
- **D3.js knowledge required**: Force simulation with custom physics parameters
- **Dual linking modes**: Tag-based uses wikilinks/shared tags, color-based connects same-colored notes
- **Node coloring**: Always uses note.color property when available
- **Link generation**: Different algorithms based on linkMode option ('tags' or 'colors')
- **Event handling**: Click handlers for note opening, drag for repositioning
- **Performance considerations**: May need optimization for >500 notes

### Color-Coded Organization System
- **Color assignment**: 8 predefined colors accessible via editor header button
- **Visual clustering**: Notes with same color automatically link in color mode
- **Persistent storage**: Colors saved in note.color property
- **macOS-style picker**: Circular color swatches in dropdown menu
- **Graph integration**: Toggle between tag-based and color-based linking

## Advanced Features Architecture

### Module Loading Strategy
The application uses progressive enhancement with page-based conditional loading:
- **Initialization layer** (`init.js`): Dependency checking and graceful app startup with retry logic
- **Router system**: Hash-based navigation with page-specific initialization and one-time loading
- **Core modules**: Always loaded (`router.js`, `app.js`, `store.js`, `search.js`, `util.js`)
- **Page-specific loading**: Features initialize only when their page is active
- **Feature modules**: Conditionally initialized via `typeof ModuleName !== 'undefined'` checks
- **Error handling**: Fallback UI creation and detailed error reporting for failed initialization

### Enhanced UI System (`advanced-ui.js`)
- **Command Palette**: ⌘/Ctrl+P for quick actions and navigation
- **Modal Management**: Centralized modal system for complex interactions
- **Status Bar**: Real-time status updates and editor statistics
- **Responsive Design**: Adaptive layouts for different screen sizes

### Advanced Editor Features (`advanced-editor.js`)
- **Version History**: Full versioning with restoration capabilities (⌘/Ctrl+H)
- **Find/Replace**: In-editor search functionality (⌘/Ctrl+F)
- **Export/Import**: Multiple format support (Markdown, JSON, plain text)
- **Distraction-Free Mode**: Focused writing environment (⌘/Ctrl+D)
- **Live Statistics**: Real-time word count, character count, and content metrics

### AI Assistant Integration (`ai-assistant.js`)
- **Smart Suggestions**: Context-aware content recommendations
- **Query Processing**: Natural language queries for note discovery
- **Content Enhancement**: AI-powered writing assistance and editing suggestions
- **Automated Tagging**: Intelligent tag suggestions based on content analysis

### Collaboration Features (`collaboration.js`)
- **Multi-tab Sync**: Real-time synchronization across browser tabs via BroadcastChannel
- **Change Broadcasting**: Automatic notification of note updates
- **Conflict Resolution**: Handling concurrent edits and version conflicts

### Plugin System (`plugin-system.js`)
- **Extensible Architecture**: Plugin-based feature additions
- **API Hooks**: Well-defined extension points for custom functionality
- **Module Registration**: Dynamic plugin discovery and initialization

### Advanced Search & Query Engine
- **Search Suggestions**: Real-time search suggestions with keyboard navigation
- **Filter System**: Date ranges, tag filters, link counts, backlink requirements
- **Query Engine**: Advanced query processing with boolean operators
- **Smart Indexing**: Optimized search indices with caching

### Workspace Management (`workspace.js`)
- **Environment Switching**: Multiple workspace configurations
- **View States**: Customizable layouts and panel arrangements
- **Session Management**: Workspace-specific settings and preferences

### Theme System (`themes.js`)
- **Dynamic Theming**: Runtime theme switching (⌘/Ctrl+Shift+T)
- **Custom Themes**: User-defined color schemes and styling
- **Responsive Themes**: Device and preference-aware theme selection

### Data Management (`data-management.js`)
- **Backup System**: Automated and manual backup creation
- **Sync Capabilities**: Cross-device synchronization options
- **Data Optimization**: Storage cleanup and performance optimization
- **Import/Export**: Comprehensive data portability features

### Monetization Framework (`monetization.js`)
- **Feature Gating**: Premium feature access control
- **Usage Tracking**: Feature usage analytics and limits
- **Subscription Management**: User tier and billing integration

## Common Development Patterns

### Adding New Pages
```javascript
// Define new page in router system
definePage('#/newpage', {
  pageId: 'page-newpage',
  onLoad: UI.initNewPage.bind(UI)
});

// Add page initializer in app.js
async initNewPage() {
  console.log('Initializing New Page...');
  this.bindNewPageEvents();
  // Page-specific initialization logic
}
```

### Adding New UI Components
```javascript
// Follow page-specific binding pattern in app.js
bindNewPageEvents() {
  const newButton = el('#newButton');
  if (newButton) newButton.onclick = () => this.newAction();
}

async newAction() {
  // Perform action with error handling
  try {
    await this.performAction();
    await this.refreshCurrentPage(); // Update current page components
    if(this.bc) this.bc.postMessage({type:'sync'}); // Notify other tabs
    
    // Notify other systems conditionally
    if (typeof Collaboration !== 'undefined') {
      Collaboration.broadcastAction('newAction');
    }
  } catch (error) {
    console.error('Action failed:', error);
    toast('Action failed');
  }
}
```

### Working with Notes
```javascript
// Always use Store methods for persistence, color defaults to gray
const note = Note.create({
  title: 'New Note', 
  tags: ['#tag1'], 
  color: '#3B82F6' // Optional: blue color
});
await Store.upsert(note);

// Recompute links after content changes
const notes = await Store.allNotes();
Note.computeLinks(note, notes);

// Update note color
note.color = '#10B981'; // Green
await Store.upsert(note);
```

### Extending Tag Functionality
```javascript
// Use TagManager for consistent behavior
const suggestions = await TagManager.suggestFromContent(noteContent);
const color = TagManager.getTagColor(tagName);
const category = TagManager.getTagCategory(tagName);
```

### Adding New Modules
```javascript
// Create new module file in js/ directory following this pattern:
const ModuleName = {
  async init() {
    // Module initialization
    console.log('ModuleName initialized');
  },
  
  // Module methods
  async doSomething() {
    // Functionality implementation
  }
};

// Add conditional loading in app.js init():
if (typeof ModuleName !== 'undefined') {
  await ModuleName.init();
}
```

### Working with Advanced Features
```javascript
// Template usage
if (typeof Templates !== 'undefined') {
  const template = Templates.apply('meeting-notes', { title: 'Weekly Meeting' });
}

// AI Assistant integration
if (typeof AiAssistant !== 'undefined') {
  const suggestions = await AiAssistant.getSuggestions(noteContent);
}

// Plugin system extension
if (typeof PluginSystem !== 'undefined') {
  PluginSystem.registerPlugin('custom-feature', {
    name: 'Custom Feature',
    init: async () => { /* plugin setup */ }
  });
}
```

## Performance Considerations

- **Memory usage**: All notes kept in memory - monitor for large datasets
- **Module loading**: Progressive enhancement prevents blocking on failed modules
- **DOM updates**: Use targeted updates rather than full re-renders
- **Search operations**: Debounced to prevent excessive computation
- **Graph rendering**: Only render when visible, limit node count for performance
- **IndexedDB operations**: Async operations with proper error handling
- **CDN dependencies**: Fallback strategies for offline functionality

## Security and Privacy

- **Client-side only**: No server dependencies, complete data ownership
- **XSS protection**: DOMPurify sanitizes all rendered content
- **Local storage**: All data remains on user's device
- **Privacy-first**: No telemetry or external data transmission
- **Offline capability**: Full functionality without internet connection

## Data Integrity

- **Link consistency**: Automatic recomputation prevents orphaned references  
- **Atomic operations**: Note updates are transactional
- **Version history**: Complete edit history with restoration capabilities
- **Backup/restore**: JSON export preserves complete application state
- **Multi-tab consistency**: BroadcastChannel ensures synchronized state
- **Data optimization**: Automated cleanup and performance optimization

## Enterprise Features

The platform includes enterprise-grade capabilities:
- **Advanced analytics**: Knowledge graph metrics and usage insights  
- **Collaboration tools**: Multi-user awareness and change broadcasting
- **Plugin architecture**: Extensible functionality for custom workflows
- **Theme management**: Customizable appearance and branding
- **Workspace management**: Environment-specific configurations
- **Data management**: Comprehensive backup, sync, and migration tools
- **Monetization framework**: Feature gating and subscription management

The application is designed as a modern, extensible knowledge management platform with strong emphasis on performance, privacy, and user experience. All development should preserve these principles while leveraging the modular architecture for feature enhancement.