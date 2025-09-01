# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Primary app code (`src/main.js`, `src/modules/*`, `src/workers/*`, `src/styles/*`, `src/types/*`).
- `js/`: Legacy/expanded modules alongside `src` (kebab-case filenames).
- `css/`: Tailwind sources (`tailwind-input.css`) and built output (`tailwind-output.css`).
- `tests/`: Unit/integration (`tests/**/*.{test,spec}.{js,ts}`) and E2E (`tests/e2e/*`).
- `index.html`: Static entry; app runs fully client-side. `dist/`: Production build output.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server at `http://localhost:8000`.
- `npm run build`: Production build to `dist/` (PWA enabled).
- `npm run preview`: Preview the production build locally.
- `npm run build-css` / `npm run build-css-prod`: Tailwind watch/minified builds.
- `npm test` / `npm run test:coverage`: Vitest with optional coverage.
- `npm run test:e2e`: Playwright E2E (spawns dev server on port 8000).
- `npm run lint` / `npm run lint:fix`: ESLint check/fix. `npm run format`: Prettier write.
- `npm run type-check`: TypeScript checks (no emit).

## Coding Style & Naming Conventions
- **Formatting**: Prettier (2-space indent, semicolons). Run `npm run format`.
- **Linting**: ESLint with `eslint-config-prettier` + `eslint-plugin-prettier` (no unused vars, prefer `const`, no `var`).
- **Names**: Files in kebab-case; code uses camelCase for functions/vars and PascalCase for types/interfaces.
- **Aliases**: Vitest `@` → `src`; TS `paths` map `@/*` → `js/*`.

## Testing Guidelines
- **Frameworks**: Vitest (jsdom) for unit/integration; Playwright for E2E.
- **Coverage**: Global thresholds ≥70% (branches, functions, lines, statements). Use `npm run test:coverage`.
- **Conventions**: Tests end with `.test.{js,ts}` or `.spec.{js,ts}` and live under `tests/unit|modules|integration`; E2E in `tests/e2e`.
- **Run locally**: `npm test` then `npm run test:e2e` (requires port `8000`).

## Commit & Pull Request Guidelines
- **Commits**: Imperative, concise subject (≤72 chars), include scope when useful. Example: `store: cache note lookups in memory`.
- **Before PR**: `npm run lint`, `npm run type-check`, `npm test`, `npm run test:e2e` (as applicable).
- **PRs**: Provide description, rationale, linked issues (e.g., `Closes #123`), and screenshots/GIFs for UI changes.

## Security & Configuration
- **Secrets**: None required; app is static and stores data in IndexedDB (`localforage`).
- **Headers**: Consider `security-headers.json` for CSP, caching, and PWA assets when deploying to static hosting.
