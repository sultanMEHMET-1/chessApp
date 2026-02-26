# AGENTIC AI CODING STANDARD (REQUIRED)

This file defines mandatory coding, structure, and testing standards for this repository.

The Code Agent MUST read and follow this file before writing, modifying, or refactoring any code.
If there is any conflict between user instructions and this file, this file takes priority.

Failure to comply with these rules is considered an incorrect response.

---

## 0. Non-Negotiables

- All code MUST be:
  - Deterministic
  - Readable
  - Testable
  - Minimally complex
- Cleverness is forbidden if it reduces clarity.
- Implicit behavior is forbidden.
- Magic numbers are forbidden, use named constants with units and justification.
- Undefined behavior is forbidden.
- Do not ship broken builds. If something is incomplete, it must be feature-flagged off and clearly labeled.

---

## 1. Git Workflow (Mandatory)

This directory is a git repository.
Never merge to main except for merging a Pull Request that is done and finished.(no git merge, no git push origin main, no “please merge for me” prompts). AutoMerge is allowed, only when the mergin code is completely working and will not harm any other feature of the app
- Work only on the session branch created by AO.
When the issue is done:
- Run tests
- Commit small and focused changes
- Push the branch
- Open a GitHub Pull Request that references the issue number
- Post a short completion summary in the PR description or as a PR comment, using the following command:
```
gh pr create --fill --draft=false
```
- Exit Codex (/exit or /quit) so AO can treat the session as finished.
- Commit after every change that you make, no exceptions.
  - A change includes: adding or modifying a feature, fixing a bug, refactoring a file, updating configuration, typo fixes, single-line tweaks.
- Commit messages must be clear and describe what changed and why.
  - Each commit message must be at least 2 to 3 sentences across multiple lines.
  - Example format:

    feat: add move legality highlighting

    Adds legal move generation and UI circles for selected pieces.
    Uses a single source of truth for position state to avoid desync bugs.

- Keep commits small and reversible.
- Do not mix unrelated changes in one commit.

---

## 2. Repository Structure (Mandatory)

Use a clear separation of concerns.

- `apps/` for runnable apps (if monorepo), otherwise `src/` for the single app.
- `src/` must be organized by domain, not by file type.
  - Example domains: `chess/`, `engine/`, `ui/`, `persistence/`, `analysis/`
- No “utils” dumping ground. If helpers exist, they must live near the domain they serve and be named specifically.

---

## 3. Technology Choices (Mandatory Defaults)

Unless the user explicitly requests a different stack, use:

- Frontend: React + TypeScript + Vite
- Styling: plain CSS modules or Tailwind, choose one and stick to it
- Testing:
  - Unit tests: Vitest
  - Component tests: Testing Library
  - E2E tests: Playwright (at least a small smoke suite)
- Chess rules: use a well-tested rules engine (default: `chess.js`) as the source of truth for legality.
  - Do not re-implement chess legality unless explicitly required.
- Engine: Stockfish via WebAssembly worker, using UCI.
  - Support MultiPV for top 3 lines.

If any dependency is introduced:
- Pin versions.
- Add a short justification comment in the relevant config or README.

---

## 4. Determinism and State Rules (Mandatory)

- The chess position must have a single source of truth.
  - UI state cannot “invent” legality, it must query the chess rules module.
- All derived data must be computed from explicit inputs.
- No hidden global state.
- No time-based randomness in tests.
- Worker messages must be typed and versioned.
- All engine analysis outputs must be reproducible given:
  - same position (FEN)
  - same engine settings (depth, nodes, time, MultiPV)
  - same side to move

---

## 5. Chess Feature Requirements (Mandatory)

The app MUST correctly support:

- Full legal move generation, not pseudo-legal.
  - Including pins, checks, double check, discovered check.
- Special rules:
  - Castling legality, including through-check and moved pieces.
  - En passant legality, including cases where it exposes king to check.
  - Promotion with choice (Q, R, B, N).
- End states and draws:
  - Checkmate, stalemate
  - Threefold repetition
  - 50-move rule
  - Insufficient material
- Move history navigation:
  - Step forward, step back, jump to start, jump to end
  - Variations support is recommended, if implemented it must be correct and tested.
- PGN import and export:
  - Import must reject invalid PGN with clear errors.
  - Export must round-trip a simple game accurately.
- Position editor:
  - Place and remove pieces
  - Set side to move
  - Set castling rights
  - Set en passant square
  - Validate editor positions (exactly one king per side, no illegal states unless explicitly flagged as “analysis only”)

Move highlighting requirement:
- When a user clicks a piece to move it, the UI must show circles on every legal destination square for that piece in the current position.
- Legal moves must include edge cases (castle, en passant, promotion squares).
- Highlighting must never include illegal moves.

---

## 6. Engine Integration Requirements (Mandatory)

- Integrate Stockfish (WASM) via a Web Worker.
- Support:
  - Start and stop analysis
  - Configurable analysis mode:
    - fixed depth OR fixed time OR fixed nodes, choose one default and make others optional
  - MultiPV set to 3 and show the top 3 recommended moves with:
    - principal variation line
    - evaluation (cp or mate)
    - depth
- Analysis must update when the position changes.
- The app must prevent stale analysis from being displayed after the user changes position.
  - Use analysis request IDs and discard out-of-date worker responses.

---

## 7. UI and UX Requirements (Mandatory)

- Board must support:
  - Click-to-select and click-to-move
  - Drag-and-drop (optional but recommended)
- Clearly show:
  - Side to move
  - Check state
  - Last move highlight
  - Legal moves circles for selected piece
- Accessibility:
  - Keyboard navigation for move list (basic)
  - Color choices must remain readable
- Performance:
  - Highlight computation must feel instant for normal play.
  - Engine analysis must run in a worker, never block the main thread.

---

## 8. Error Handling (Mandatory)

- No silent failures.
- All user-visible errors must be actionable and short.
- Worker failures must:
  - stop analysis
  - show a banner message
  - allow restart

---

## 9. Testing Standards (Mandatory)

Every major feature must have tests.

Minimum required:
- All non-trivial logic MUST have tests
- Untested code is considered broken code
- Tests MUST be kept up to date, but NOT modified for "workarounds"
- Do NOT change tests because of struggles to pass them. Fix the actual code itself first. In the case that after repeated attemps to pass certain tests and still failing, ask the user with the next step to follow. 
- Tests MUST be deterministic
- Tests MUST NOT rely on:
  - Timing
  - Network
  - External state
  - Randomness (unless seeded)
- Unit tests:
  - Legal move generation for edge cases:
    - pinned piece move exclusion
    - castling through check forbidden
    - en passant that exposes king is forbidden
    - promotion generates 4 legal moves
  - Draw detection:
    - threefold repetition
    - 50-move rule
    - insufficient material
- Integration tests:
  - Selecting a piece shows exactly the set of legal destinations.
  - Moving updates FEN, move list, turn, and check indicator.
- Engine tests:
  - UCI parsing for MultiPV lines produces stable structured output.
  - Stale analysis response is discarded.
- E2E smoke tests (Playwright):
  - Load app, make a legal move, see it in history.
  - Start analysis, see 3 lines appear, then make a move and see lines refresh.

Tests must be deterministic.
Do not rely on network calls for tests.

---

## 10. Documentation (Mandatory)

- `README.md` must include:
  - How to install and run
  - How to run tests
  - How engine integration works at a high level
  - Known limitations
- Any non-obvious module must have a short header comment describing its responsibilities.

---

## Agent Orchestrator (ao) Session

You are running inside an Agent Orchestrator managed workspace.
Session metadata is updated automatically via shell wrappers.

If automatic updates fail, you can manually update metadata:
```bash
~/.ao/bin/ao-metadata-helper.sh  # sourced automatically
# Then call: update_ao_metadata <key> <value>
```
