# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mahart Linked Notes is an advanced client-side knowledge management platform that runs entirely in the browser without requiring a server. It has evolved far beyond a basic Zettelkasten into a comprehensive unified platform featuring AI assistance, collaboration tools, advanced analytics, plugin architecture, and enterprise-grade features. The application implements sophisticated note-taking with wikilinks, bidirectional backlinks, enhanced tag management, full-text search, force-directed graph visualization, and many advanced features.

## Development Commands

### Running the Application
```bash
# Open the application (no build process required)
open index.html
# Or serve via local web server for better debugging
python -m http.server 8000
# Then open http://localhost:8000
```

### Testing the Application
```bash
# No automated tests currently exist
# Manual testing: Open index.html in browser and verify:
# 1. Note creation/editing works
# 2. Wikilinks resolve correctly ([[Note Title]] and [[ID:xxxx]])  
# 3. Tags display and filter properly
# 4. Search returns relevant results
# 5. Graph visualization renders
# 6. Multi-tab sync works (open multiple tabs)
# 7. Export/import preserves data
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

### Modular MVC Pattern
The application uses a modular architecture with clear separation of concerns:

- **UI Layer** (`app.js`): Event handling, DOM manipulation, user interaction orchestration
- **Data Layer** (`store.js`): IndexedDB persistence via localforage, CRUD operations, import/export
- **Feature Modules**: Search engine, graph visualization, analytics, tag management

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
- **Node sizing**: Proportional to link count (degree centrality)
- **Interactive**: Drag nodes, click to open notes
- **Performance**: Optimized for ~100-500 notes

### Storage Strategy
- **LocalForage**: IndexedDB wrapper with localStorage fallback
- **Full-table operations**: All notes loaded into memory for cross-referencing
- **Atomic updates**: Individual note upserts maintain consistency
- **Multi-tab sync**: BroadcastChannel API for real-time synchronization

## File Structure

```
/
├── index.html              # Single-page application entry point with comprehensive UI
├── css/styles.css          # Complete styling for unified platform
├── js/
│   ├── app.js             # Main UI orchestration and event handling
│   ├── store.js           # Data persistence and CRUD operations  
│   ├── search.js          # Full-text search with token scoring
│   ├── graph.js           # D3-based force-directed visualization
│   ├── analytics.js       # Performance monitoring and usage metrics
│   ├── tags.js            # Enhanced tag management with categories
│   ├── util.js            # Common utilities (debounce, DOM helpers, etc.)
│   ├── advanced-editor.js # Advanced editing features, versioning, export/import
│   ├── advanced-search.js # Enhanced search with filters and suggestions
│   ├── advanced-ui.js     # Command palette, modals, enhanced UX
│   ├── advanced-viz.js    # Advanced graph visualizations and analytics
│   ├── ai-assistant.js    # AI-powered assistance and suggestions
│   ├── collaboration.js   # Multi-user collaboration features
│   ├── data-management.js # Backup, sync, and data management
│   ├── graph-analytics.js # Graph analysis and network metrics
│   ├── init.js           # Application initialization and module loading
│   ├── monetization.js   # Premium features and subscription management
│   ├── plugin-system.js  # Extensible plugin architecture
│   ├── query-engine.js   # Advanced query processing
│   ├── recommendations.js # Content recommendations and suggestions
│   ├── templates.js      # Note templates and scaffolding
│   ├── themes.js         # Theme management and customization
│   └── workspace.js      # Workspace management and environments
├── data/
│   ├── meta.json          # Application metadata
│   └── claude_prompts.md  # Development prompts and context
└── README.md              # Basic project documentation
```

## External Dependencies

The application loads modern libraries from CDN for enhanced functionality:
- **LocalForage**: IndexedDB wrapper with localStorage fallback
- **Marked.js**: Markdown parsing and rendering
- **DOMPurify**: XSS protection for rendered content  
- **Chart.js**: Analytics charts and data visualization
- **D3.js**: Force-directed graph visualization and network analysis

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
- **Node sizing logic**: Based on `links.length` property of notes
- **Event handling**: Click handlers for note opening, drag for repositioning
- **Performance considerations**: May need optimization for >500 notes

## Advanced Features Architecture

### Module Loading Strategy
The application uses progressive enhancement with conditional module loading:
- **Core modules**: Always loaded (`app.js`, `store.js`, `search.js`, `util.js`)
- **Feature modules**: Conditionally initialized via `typeof ModuleName !== 'undefined'` checks
- **Initialization sequence**: Controlled by `init.js` for proper dependency resolution

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

### Adding New UI Components
```javascript
// Follow existing pattern in app.js with conditional module loading
bind() {
  const newButton = el('#newButton');
  if (newButton) newButton.onclick = () => this.newAction();
}

async newAction() {
  // Perform action with error handling
  try {
    await this.performAction();
    await this.refresh(); // Update all UI components
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
// Always use Store methods for persistence
const note = Note.create({title: 'New Note', tags: ['#tag1']});
await Store.upsert(note);

// Recompute links after content changes
const notes = await Store.allNotes();
Note.computeLinks(note, notes);
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