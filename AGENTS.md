# AGENTS.md

This file defines the development contract for all coding agents.
Agents must read this file before making any code changes.
If any instruction conflicts with other sources, this file wins.

## Tooling
- Node.js 20+
- pnpm
- React + TypeScript + Vite
- Vitest for unit tests
- Playwright for end-to-end smoke tests

## Workflow
- One issue per branch and one PR per issue.
- Branch names must link to the issue, for example `feat/1`.
- Keep commits small and focused.
- Every commit message must be 2 to 3 sentences across multiple lines.
- Include the issue number in commit messages, for example `Refs #1` in the body.

## Testing
- Run unit tests before pushing.
- Run the Playwright smoke suite before pushing.

## Code Style and Architecture
- TypeScript must run in `strict` mode.
- Do not duplicate chess rules or legality logic outside the rules engine.

## Agent Orchestrator (ao) Session

You are running inside an Agent Orchestrator managed workspace.
Session metadata is updated automatically via shell wrappers.

If automatic updates fail, you can manually update metadata:
```bash
~/.ao/bin/ao-metadata-helper.sh  # sourced automatically
# Then call: update_ao_metadata <key> <value>
```
