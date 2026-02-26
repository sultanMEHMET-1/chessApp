# Chess App

Scaffold for a React + TypeScript + Vite chess application.

## Install And Run
Requires Node.js 20+ and pnpm.

- `pnpm install`
- `pnpm dev`

## Scripts
- `pnpm dev` starts the Vite dev server.
- `pnpm build` runs typecheck and builds for production.
- `pnpm preview` serves the production build locally.
- `pnpm test` runs unit tests once with Vitest.
- `pnpm test:watch` runs unit tests in watch mode.
- `pnpm e2e` runs Playwright smoke tests.
- `pnpm e2e:ui` opens Playwright UI mode.

## Tests
Run unit tests with `pnpm test` (Vitest). Run the Playwright smoke suite with `pnpm e2e`.

## Engine Integration (High Level)
Stockfish will run in a dedicated Web Worker using UCI. The worker will accept typed, versioned messages for analysis requests (depth, time, or nodes), return MultiPV lines (top 3), and include a request id so stale responses can be discarded when the position changes.

## Known Limitations
- Chess UI and engine worker are not yet implemented.
- E2E smoke coverage is limited to the app shell until the board UI exists.

## Dependency Notes
Versions are pinned in `package.json` to keep builds reproducible.

- `chess.js`: rules engine for legal move generation and position state.
- `react`, `react-dom`: UI rendering and component model.
- `vite`, `@vitejs/plugin-react`: fast dev server and optimized build pipeline.
- `typescript`: typed application code and config.
- `vitest`, `jsdom`: unit test runner and DOM test environment.
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`: user-focused component testing helpers.
- `@playwright/test`: end-to-end smoke testing.
- `@types/react`, `@types/react-dom`: TypeScript typings for React.
