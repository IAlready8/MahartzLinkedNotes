# Mahart Linked Notes - Qwen Context

This document provides essential context for Qwen Code when working with the Mahart Linked Notes project. It summarizes the project's purpose, structure, and key development practices.

## Project Overview

Mahart Linked Notes is an advanced, client-side knowledge management platform. It runs entirely in the browser without requiring a server, using IndexedDB (via localforage) for data storage. The application has evolved into a comprehensive unified platform featuring AI assistance, collaboration tools, advanced analytics, a plugin architecture, and enterprise-grade features, far beyond a basic Zettelkasten system.

### Key Features

- **Note Management**: Create, edit, and organize notes with titles, content, tags, and color-coding.
- **Wikilinks**: Bidirectional linking between notes using `[[Note Title]]` or `[[ID:xxxx]]` formats.
- **Backlinks**: Automatic computation and display of incoming links.
- **Tag System**: Enhanced tag management with predefined categories and color coding.
- **Search**: Full-text search across titles, tags, and content with token-based scoring.
- **Graph Visualization**: D3.js powered force-directed graph showing relationships based on tags or colors.
- **Advanced Editor**: Monaco Editor for rich text editing with live preview.
- **Version History**: Track and restore previous versions of notes.
- **Multi-tab Sync**: Real-time synchronization across open browser tabs.
- **AI Assistant**: Context-aware suggestions, content enhancement, and query processing.
- **Plugin System**: Extensible architecture for adding new functionalities.
- **Themes**: Customizable user interface appearance.
- **Workspaces**: Multi-environment organization.
- **Data Management**: Backup, restore, and synchronization capabilities.
- **Enterprise Features**: Advanced analytics, collaboration tools, and monetization framework.

## Project Structure

```
/
├── index.html              # Main HTML file, entry point for the SPA
├── package.json            # Project metadata, dependencies, and scripts
├── README.md               # Basic project overview
├── AGENTS.md               # Repository guidelines for structure, commands, and PRs
├── CLAUDE.md               # Context and guidelines for Claude Code
├── AI_DESIGN_SYSTEM_GUIDELINES.md # Comprehensive design system documentation
├── ENTERPRISE-FEATURES.md  # Summary of advanced enterprise features
├── ENHANCEMENTS.md         # Details on performance optimizations and UX improvements
├── IMPLEMENTATION-SUMMARY.md # Summary of implemented enterprise features
├── PLATFORM-DOCS.md        # Developer documentation and API
├── css/
│   ├── styles.css          # Main CSS file (Tailwind output + custom styles)
│   ├── premium-design.css  # Core design system styles
│   └── ...                 # Other CSS files for specific features
├── js/
│   ├── app.js             # Main application logic, page-specific UI orchestration
│   ├── router.js          # Client-side hash-based router
│   ├── store.js           # Data persistence and CRUD operations
│   ├── search.js          # Search engine
│   ├── graph.js           # Graph visualization
│   ├── ...                # Many other JS files for features (ai-assistant.js, plugin-system.js, etc.)
├── tests/                 # Unit, integration, and E2E tests
└── data/                  # Application data and metadata
```

## Technology Stack

- **Core**: HTML, CSS (Tailwind), JavaScript (ES2020+)
- **UI Framework**: None (Vanilla JS with modular components)
- **State Management**: Client-side state managed in-memory and persisted via IndexedDB
- **Storage**: IndexedDB via `localforage`
- **Router**: Custom hash-based router
- **Editor**: Monaco Editor
- **Markdown**: `marked.js` and `DOMPurify`
- **Visualization**: D3.js, Chart.js
- **ID Generation**: ULID
- **Build Tools**: Vite
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Linting/Formatting**: ESLint, Prettier
- **Type Checking**: TypeScript (checks only, no build step)

## Development Commands

- **Development Server**: `npm run dev` (Starts Vite dev server on port 8000)
- **Build**: `npm run build` (Builds production assets to `dist/`)
- **Preview Build**: `npm run preview` (Previews the production build)
- **Build CSS**: `npm run build-css` (Watch and rebuild Tailwind CSS)
- **Build CSS (Prod)**: `npm run build-css-prod` (Build minified Tailwind CSS)
- **Test**: `npm test` (Run Vitest unit/integration tests)
- **Test UI**: `npm run test:ui` (Run Vitest with UI)
- **Test Coverage**: `npm run test:coverage` (Run tests with coverage report)
- **Test E2E**: `npm run test:e2e` (Run Playwright E2E tests)
- **Lint**: `npm run lint` (Check for linting errors)
- **Lint Fix**: `npm run lint:fix` (Fix linting errors)
- **Format**: `npm run format` (Format code with Prettier)
- **Type Check**: `npm run type-check` (Run TypeScript checks)

## Core Architecture

### SPA & Routing

The application is a Single Page Application (SPA) using a hash-based router (`js/router.js`). Navigation between different views (Editor, Graph, Tags, AI, Settings) is managed by the router, which loads specific page content and initializes page-specific JavaScript modules.

### Data Flow

```
User Action -> UI Event Handler -> Data Store Operation (IndexedDB) -> Refresh UI Components
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

## Development Guidelines

### Modularity & Feature Loading

- Code is organized into modules (mostly in `js/`).
- Core modules (router, app, store, search, util) are always loaded.
- Advanced features are conditionally loaded and initialized based on the current page or user actions. Check for module existence before use (e.g., `if (typeof AiAssistant !== 'undefined')`).

### UI & Design System

- The application uses a comprehensive design system detailed in `AI_DESIGN_SYSTEM_GUIDELINES.md`.
- CSS is built using Tailwind CSS with custom components defined in `css/premium-design.css` and other CSS files.
- Follow the established design tokens (colors, spacing, typography) and component patterns.

### Data Consistency

- Always use `Store` methods (`js/store.js`) for interacting with data.
- After modifying a note's content, recompute its links using `Note.computeLinks(note, allNotes)`.
- After any data change, rebuild the search index (`Search.buildIndex(notes)`).
- Notify other tabs of changes using `BroadcastChannel`.

### Performance

- The application is designed to handle large datasets (1000+ notes) efficiently.
- Be mindful of memory usage and DOM updates.
- Debounce expensive operations like search input handling and live preview updates.

### Security & Privacy

- The application is client-side only, ensuring user data privacy.
- All rendered content is sanitized using `DOMPurify`.
- No external data transmission occurs.

### Testing

- Write unit and integration tests using Vitest.
- Write E2E tests using Playwright.
- Ensure new features are covered by tests.
- Run `npm test` and `npm run test:e2e` before submitting changes.

## Key Files to Know

- `index.html`: Entry point and main SPA structure.
- `js/app.js`: Central hub for UI logic and event handling.
- `js/router.js`: SPA routing system.
- `js/store.js`: Data persistence layer.
- `js/search.js`: Search engine implementation.
- `js/graph.js`: Graph visualization logic.
- `css/premium-design.css`: Core design system styles.
- `AI_DESIGN_SYSTEM_GUIDELINES.md`: Detailed UI/UX guidelines.
- `AGENTS.md`: Repository contribution guidelines.
- `CLAUDE.md`: Developer context and patterns (also relevant for Qwen).
