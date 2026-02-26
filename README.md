# Chess App

A React + TypeScript chess UI backed by chess.js for move legality and a Stockfish (WASM) analysis worker.

## Install And Run
Requires Node.js 20+ and pnpm.

1. `pnpm install`
2. `pnpm dev`

## Tests
- Unit + integration (Vitest): `pnpm test`
- Playwright smoke suite: `pnpm playwright:test`

## Engine Integration (High Level)
- Stockfish runs in a Web Worker using UCI.
- The UI requests analysis with explicit settings (depth/time/nodes) and MultiPV set to 3.
- Each analysis request is tagged with an ID so stale results are discarded when the position changes.

## Known Limitations
- Promotion defaults to queen; underpromotion selection will be added in a later issue.
- The position editor validates FEN using chess.js rules; analysis-only illegal setups are limited to what FEN validation allows.
