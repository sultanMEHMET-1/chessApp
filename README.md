# Chess App

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
