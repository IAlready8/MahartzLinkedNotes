# Mahart Linked Notes (Static App)

Open `index.html` in a modern browser. No server needed.

## Features

- [[wikilinks]], tags (#tag), backlinks
- Graph view (force layout) + simple mind map
- Markdown editor + preview
- Search (title, tags, body tokens)
- Analytics: usage, performance, link density, note health
- Real-time events across tabs (BroadcastChannel)

## Data

- Stored in `localforage` (IndexedDB under the hood)
- Import/Export JSON from Settings

## Keyboard

- Cmd/Ctrl+K: Quick search
- Cmd/Ctrl+N: New note
- Cmd/Ctrl+S: Save

## Deployment

### Vercel Deployment

This application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel, and it will automatically detect and deploy the application.

The configuration includes:

- Proper routing for client-side navigation
- Security headers for enhanced security
- Static file serving

### Manual Deployment

Open `index.html` in a modern browser. No server needed.

## Contributing

See Repository Guidelines in `AGENTS.md` for structure, commands, and PR expectations.
