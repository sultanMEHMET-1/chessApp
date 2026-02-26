import { describe, expect, it } from 'vitest';
import { STARTING_FEN } from './constants';
import {
  applyMoveToTimeline,
  createTimeline,
  exportTimelinePgn,
  getCurrentFen,
  getCurrentStatus,
  getLastMove,
  importPgnToTimeline,
  setTimelinePly
} from './gameState';
import type { MoveSelection } from './types';

const SIMPLE_MOVE: MoveSelection = { from: 'e2', to: 'e4' };
const INVALID_PGN = 'not a pgn';
const EXPECTED_PLY = 1; // One move applied.

describe('game timeline helpers', () => {
  it('creates a timeline at the starting position', () => {
    const timeline = createTimeline();

    expect(timeline.initialFen).toBe(STARTING_FEN);
    expect(timeline.currentPly).toBe(0);
    expect(getCurrentFen(timeline)).toBe(STARTING_FEN);
  });

  it('applies a legal move and updates the current position', () => {
    const timeline = createTimeline();
    const updated = applyMoveToTimeline(timeline, SIMPLE_MOVE);

    expect(updated).not.toBeNull();
    expect(updated?.currentPly).toBe(EXPECTED_PLY);
    expect(getLastMove(updated!)).toMatchObject({ from: 'e2', to: 'e4' });
    expect(getCurrentStatus(updated!).turn).toBe('b');
  });

  it('clamps timeline navigation to legal bounds', () => {
    const timeline = createTimeline();
    const updated = applyMoveToTimeline(timeline, SIMPLE_MOVE)!;

    const clamped = setTimelinePly(updated, 99);
    expect(clamped.currentPly).toBe(updated.moves.length);
  });

  it('imports invalid PGN with a clear error', () => {
    const { error } = importPgnToTimeline(INVALID_PGN);

    expect(error).toBeDefined();
  });

  it('exports PGN for the current timeline slice', () => {
    const timeline = applyMoveToTimeline(createTimeline(), SIMPLE_MOVE)!;
    const pgn = exportTimelinePgn(timeline);

    expect(pgn).toContain('e4');
  });
});
