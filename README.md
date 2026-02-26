# Chess App

Scaffold for a React + TypeScript + Vite chess application.

## Setup

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

## Engine Integration (Planned)

Stockfish will run in a dedicated Web Worker using UCI. The worker will accept typed, versioned messages for analysis requests (depth, time, or nodes), return MultiPV lines (top 3), and include a request id so stale responses can be discarded when the position changes.

## Dependency Rationale

Versions are pinned in `package.json` to keep builds reproducible.

- `react`, `react-dom`: UI rendering and component model.
- `vite`, `@vitejs/plugin-react`: fast dev server and optimized build pipeline.
- `typescript`: typed application code and config.
- `vitest`, `jsdom`: unit test runner and DOM test environment.
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`: user-focused component testing helpers.
- `@playwright/test`: end-to-end smoke testing.
- `@types/react`, `@types/react-dom`: TypeScript typings for React.

## Known Limitations

- Chess rules, move history, and engine integration are not implemented yet.
- The current UI is a placeholder layout for future features.
This repository is developed via Agent Orchestrator. There is no application code yet; only docs and configs are present.

## Install And Run
Requires Node.js 20+ and pnpm. Once the app scaffold is added, run `pnpm install` and then `pnpm dev` to start the Vite dev server.

## Tests
Run unit tests with `pnpm test` (Vitest). Run the Playwright smoke suite with `pnpm playwright test`.

## Dependencies
- `chess.js` is pinned to provide a proven rules engine without re-implementing legality logic.
- `vitest` and `@playwright/test` are pinned to keep unit and smoke tests deterministic.
- `typescript` and `@types/node` are pinned to enforce strict typing in the toolchain.

## Engine Integration (High Level)
The chess engine will run Stockfish (WASM) in a Web Worker and speak UCI. The UI will request analysis with explicit settings (depth, time, or nodes) and MultiPV set to 3. Analysis responses will be tagged with request IDs so stale results are discarded when the position changes.

## Known Limitations
- Application scaffold, chess UI, and engine worker are not yet implemented.
- Test commands will be wired once the project is bootstrapped.
