# Chess App

A React + TypeScript chess UI backed by chess.js for move legality and a Stockfish (WASM) analysis worker.

## Install And Run
Requires Node.js 20+ and pnpm.

1. `pnpm install`
2. `pnpm dev`

## Scripts
- `pnpm dev` starts the Vite dev server.
- `pnpm build` runs typecheck and builds for production.
- `pnpm preview` serves the production build locally.
- `pnpm test` runs unit + integration tests once with Vitest.
- `pnpm test:watch` runs Vitest in watch mode.
- `pnpm e2e` runs the Playwright smoke suite.
- `pnpm e2e:ui` opens Playwright UI mode.

## Tests
- Unit + integration (Vitest): `pnpm test`
- Playwright smoke suite: `pnpm e2e`

## Engine Integration (High Level)
- Stockfish runs in a dedicated Web Worker using UCI.
- The UI requests analysis with explicit settings (default: fixed depth 8; time/nodes optional) and MultiPV set to 3.
- Each analysis request is tagged with an ID so stale results are discarded when the position changes.

## Known Limitations
- Promotion defaults to queen; underpromotion selection will be added in a later issue.
- The position editor validates FEN using chess.js rules, so analysis-only illegal setups are limited to what FEN validation allows.
- E2E coverage is currently a small smoke suite.

## Dependency Notes
Versions are pinned in `package.json` to keep builds reproducible.

- `chess.js`: rules engine for legal move generation and position state.
- `stockfish`: WebAssembly chess engine for analysis.
- `react`, `react-dom`: UI rendering and component model.
- `vite`, `@vitejs/plugin-react`: dev server and build pipeline.
- `vitest`, `jsdom`: unit test runner and DOM test environment.
- `@testing-library/*`: user-focused component testing helpers.
- `@playwright/test`: end-to-end smoke testing.
