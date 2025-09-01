# AI Design System Usage Guidelines

## Overview

This document provides comprehensive instructions for AI systems working with the Mahart Linked Notes design system. It includes specific file references, component patterns, and integration requirements.

## Design System Architecture

Your design system is built on a multi-layered architecture:
- **Base Layer**: TailwindCSS utility framework (`css/styles.css`)
- **Premium Layer**: Ultra-premium enterprise design (`css/premium-design.css`)
- **Enhancement Layer**: Feature-specific styles (`css/final-enhancements.css`, `css/premium-editor.css`)
- **Component Layer**: JavaScript UI components (`js/advanced-ui-components.js`)

## File Structure & Locations

```
css/
├── styles.css              # Compiled Tailwind + base styles
├── premium-design.css      # Core design system with CSS variables
├── premium-editor.css      # Editor-specific enhancements
├── final-enhancements.css  # Latest UI refinements
└── enhanced-sidebar.css    # Sidebar-specific styles

js/
├── advanced-ui-components.js  # Toast, Loading, Context Menu, Tooltips
├── advanced-ui.js            # Command palette, modals, status bar
└── app.js                    # Page-specific UI orchestration
```

## Core Design Tokens

When creating new components, use these CSS custom properties from `css/premium-design.css:4-40`:

```css
/* Colors */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
--accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
--success-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)

/* Glass Morphism */
--glass-primary: rgba(103, 126, 234, 0.1)
--glass-secondary: rgba(255, 255, 255, 0.05)
--glass-border: rgba(255, 255, 255, 0.1)

/* Shadows */
--shadow-premium: 0 32px 64px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.15)
--shadow-floating: 0 20px 40px rgba(103, 126, 234, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1)
--shadow-glow: 0 0 40px rgba(103, 126, 234, 0.6)

/* Typography */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace

/* Spacing Scale */
--space-xs: 0.25rem
--space-sm: 0.5rem  
--space-md: 1rem
--space-lg: 1.5rem
--space-xl: 2rem
--space-2xl: 3rem
--space-3xl: 4rem
```

## Component Patterns & Usage

### 1. Cards (`css/premium-design.css:256-282`)

**AI Instructions**: Always use the `.card` class for content containers. Cards provide glass morphism effects and premium shadows.

```html
<div class="card">
  <div class="card-header">
    <h3>Component Title</h3>
    <div class="flex items-center gap-2">
      <!-- Header actions -->
    </div>
  </div>
  <div class="p-6">
    <!-- Card content -->
  </div>
</div>
```

**Key Features**:
- Glass morphism background: `rgba(255, 255, 255, 0.08)`
- Premium shadows with hover effects
- Rounded corners: `var(--radius-xl)`
- Gradient border accent on top

### 2. Buttons (`css/premium-design.css:385-413`)

**AI Instructions**: Use these button variants based on hierarchy:

```html
<!-- Primary action -->
<button class="btn-primary">Save Changes</button>

<!-- Secondary actions -->
<button class="btn">Cancel</button>

<!-- Icon buttons -->
<button class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
  <i class="fas fa-search"></i>
</button>
```

### 3. Input Fields (`css/premium-design.css:366-382`)

**AI Instructions**: All form inputs should use glass morphism styling:

```html
<input class="input-field" type="text" placeholder="Enter text">
<textarea class="input-field" rows="4"></textarea>
<select class="input-field">
  <option>Option 1</option>
</select>
```

### 4. Navigation Items (`css/premium-design.css:174-236`)

**AI Instructions**: For sidebar navigation, use this exact structure:

```html
<a href="#/page" class="nav-item">
  <i class="fas fa-icon w-4 mr-2 text-center text-xs"></i>
  <span class="truncate">Page Name</span>
  <kbd class="ml-auto text-xs bg-gray-700 px-1 rounded">⌘K</kbd>
</a>
```

**Features**:
- Shimmer hover animation
- Keyboard shortcut display
- Active state with blue accent
- Smooth transforms

## JavaScript Component Usage

### Toast Notifications (`js/advanced-ui-components.js:4-33`)

```javascript
// Success message
ToastManager.show('Note saved successfully!', 'success');

// Error message  
ToastManager.show('Failed to save note', 'error');

// With custom duration
ToastManager.show('Custom message', 'info', 5000);
```

### Loading States (`js/advanced-ui-components.js:36-55`)

```javascript
// Show loading
LoadingManager.show(buttonElement, 'Saving...');

// Hide loading
LoadingManager.hide(buttonElement);
```

### Context Menus (`js/advanced-ui-components.js:58-104`)

```javascript
ContextMenu.show(x, y, [
  { icon: 'fas fa-edit', label: 'Edit', action: () => editNote() },
  { icon: 'fas fa-trash', label: 'Delete', action: () => deleteNote() },
  { separator: true },
  { icon: 'fas fa-copy', label: 'Copy Link', shortcut: '⌘C', action: () => copyLink() }
]);
```

## Color System Usage

Your app uses an 8-color system for note organization (`index.html:185-192`):

```javascript
const noteColors = {
  gray: '#6B7280',    // Default
  blue: '#3B82F6',    // Projects
  green: '#10B981',   // Completed
  amber: '#F59E0B',   // In Progress
  red: '#EF4444',     // Urgent
  purple: '#8B5CF6',  // Ideas
  orange: '#F97316',  // Research
  cyan: '#06B6D4'     // Archive
};
```

## Responsive Design Patterns

**AI Instructions**: Follow mobile-first approach with these breakpoints:

```css
/* Mobile adjustments (css/premium-design.css:555-579) */
@media (max-width: 768px) {
  #main-sidebar {
    position: fixed;
    transform: translateX(-100%);
    z-index: 100;
  }
  
  .flex-grow.grid {
    grid-template-columns: 1fr;
  }
}
```

## Animation Guidelines

Use these predefined animations (`css/premium-design.css:539-552`):

```css
@keyframes shimmer { /* For loading states */ }
@keyframes float { /* For floating elements */ }
@keyframes pulse-glow { /* For emphasis */ }
```

## Accessibility Requirements

1. **Focus States**: All interactive elements must have visible focus indicators
2. **ARIA Labels**: Use `title` attributes for buttons and icons
3. **Semantic HTML**: Use proper heading hierarchy (h1-h6)
4. **Color Contrast**: Maintain WCAG AA compliance with white text on dark backgrounds

## Performance Guidelines

1. **CSS Variables**: Always use CSS custom properties for theming
2. **Backdrop Filters**: Use `backdrop-filter: blur()` for glass effects
3. **Transitions**: Keep transition durations under 300ms
4. **Z-index Scale**: Follow established layering (modals: 50, tooltips: 50, fixed elements: 10)

## When to Create New Components

**AI Instructions**: Create new CSS components when:
1. A pattern repeats more than 3 times
2. Complex state management is needed
3. Accessibility features require standardization

Add new components to `css/premium-design.css` following the existing naming convention and using the established design tokens.

## Integration with Existing Systems

When adding new features, ensure compatibility with:
- **Router System**: Hash-based navigation (`js/router.js`)
- **Data Store**: IndexedDB through LocalForage (`js/store.js`)
- **Multi-tab Sync**: BroadcastChannel API for real-time updates
- **Module Loading**: Progressive enhancement with feature detection

**Example Integration**:
```javascript
// Always check if modules are available
if (typeof ToastManager !== 'undefined') {
  ToastManager.show('Feature updated', 'success');
}

// Use consistent error handling
try {
  await Store.upsert(note);
  this.refreshCurrentPage();
} catch (error) {
  console.error('Operation failed:', error);
  if (typeof ToastManager !== 'undefined') {
    ToastManager.show('Operation failed', 'error');
  }
}
```

## Component Library Quick Reference

### Core Components
- `.card` - Main content containers with glass morphism
- `.card-header` - Standardized card headers with actions
- `.btn`, `.btn-primary` - Button variants with hover effects
- `.input-field` - Form inputs with glass styling
- `.nav-item` - Sidebar navigation with animations

### Layout Components
- `#app-container` - Main app grid layout
- `#main-sidebar` - Resizable navigation sidebar
- `#main-content` - Primary content area

### Utility Classes
- `.premium-glow` - Adds glow effect on hover
- `.loading` - Loading state for buttons/elements
- `.toast` - Notification styling

### JavaScript Managers
- `ToastManager` - Notification system
- `LoadingManager` - Loading state management
- `ContextMenu` - Right-click context menus
- `TooltipManager` - Hover tooltips

## File Modification Guidelines

1. **CSS Changes**: Add new styles to `css/premium-design.css` or create feature-specific CSS files
2. **Component Logic**: Extend `js/advanced-ui-components.js` for reusable UI components
3. **Page Logic**: Modify `js/app.js` for page-specific functionality
4. **Always**: Follow existing patterns and maintain consistency with the established design system

This comprehensive guide ensures all AI development follows the established design patterns and maintains the premium, cohesive user experience of the Mahart Linked Notes platform.