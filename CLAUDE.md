# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mahart Linked Notes is a client-side Zettelkasten-style knowledge management application that runs entirely in the browser without requiring a server. It implements sophisticated note-taking with wikilinks, bidirectional backlinks, tag management, full-text search, and force-directed graph visualization.

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

### Development Tools
```bash
# Enable browser dev tools for debugging
# Key debugging areas:
# - IndexedDB inspection (Application tab in Chrome DevTools)
# - Console errors during note operations
# - Performance timing in the Performance panel
# - Network tab should show no requests (pure client-side app)
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
├── index.html              # Single-page application entry point
├── css/styles.css          # Complete styling including enhanced tag system
├── js/
│   ├── app.js             # Main UI orchestration and event handling
│   ├── store.js           # Data persistence and CRUD operations  
│   ├── search.js          # Full-text search with token scoring
│   ├── graph.js           # D3-based force-directed visualization
│   ├── analytics.js       # Performance monitoring and usage metrics
│   ├── tags.js            # Enhanced tag management with categories
│   └── util.js            # Common utilities (debounce, DOM helpers, etc.)
├── data/
│   ├── meta.json          # Application metadata
│   └── claude_prompts.md  # Development prompts and context
└── README.md              # Basic project documentation
```

## Development Guidelines

### Adding New Features
1. **Follow modular pattern**: Create new files for substantial features, extend existing modules for enhancements
2. **Maintain data consistency**: Always recompute links after note modifications
3. **Update search index**: Call `Search.buildIndex()` after data changes
4. **Preserve multi-tab sync**: Use BroadcastChannel for cross-tab notifications
5. **Consider performance**: All operations must work with 100+ notes loaded in memory

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

## Common Development Patterns

### Adding New UI Components
```javascript
// Follow existing pattern in app.js
bind() {
  el('#newButton').onclick = () => this.newAction();
}

async newAction() {
  // Perform action
  await this.refresh(); // Update all UI components
  if(this.bc) this.bc.postMessage({type:'sync'}); // Notify other tabs
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

## Performance Considerations

- **Memory usage**: All notes kept in memory - monitor for large datasets
- **DOM updates**: Use targeted updates rather than full re-renders
- **Search operations**: Debounced to prevent excessive computation
- **Graph rendering**: Only render when visible, limit node count for performance
- **IndexedDB operations**: Async operations with proper error handling

## Data Integrity

- **Link consistency**: Automatic recomputation prevents orphaned references  
- **Atomic operations**: Note updates are transactional
- **Backup/restore**: JSON export preserves complete application state
- **Multi-tab consistency**: BroadcastChannel ensures synchronized state

The application is designed for local-first operation with strong emphasis on data ownership, privacy, and offline capability. All development should preserve these core principles while enhancing the user experience for knowledge workers and researchers.