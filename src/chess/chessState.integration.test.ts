import { describe, expect, it } from 'vitest';
import { ChessState } from './chessState';
import { applyMove, getLegalDestinations } from './selection';
import type { Square } from 'chess.js';

const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EXPECTED_KNIGHT_SQUARE: Square = 'b1';
const EXPECTED_KNIGHT_DESTINATIONS: Square[] = ['a3', 'c3'];
const EXPECTED_KNIGHT_DESTINATION_COUNT = 2;
const OPENING_MOVE = { from: 'e2', to: 'e4' };
const EXPECTED_FEN_AFTER_E4 =
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const EXPECTED_HISTORY_LENGTH = 1;
const CHECK_FLAG_AFTER_E4 = false;

function sortSquares(squares: Square[]): Square[] {
  return [...squares].sort();
}

describe('ChessState integration', () => {
  it('returns exactly the legal destinations for a selected square', () => {
    const state = new ChessState(START_FEN);
    const destinations = getLegalDestinations(state, EXPECTED_KNIGHT_SQUARE);

    expect(destinations).toHaveLength(EXPECTED_KNIGHT_DESTINATION_COUNT);
    expect(sortSquares(destinations)).toEqual(
      sortSquares(EXPECTED_KNIGHT_DESTINATIONS)
    );
  });

  it('updates FEN, history, side to move, and check state after a move', () => {
    const state = new ChessState(START_FEN);
    const result = applyMove(state, OPENING_MOVE);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Expected move to be legal: ${result.error}`);
    }

    expect(result.fen).toBe(EXPECTED_FEN_AFTER_E4);
    expect(state.getFen()).toBe(EXPECTED_FEN_AFTER_E4);
    expect(state.getSideToMove()).toBe('b');
    expect(state.isInCheck()).toBe(CHECK_FLAG_AFTER_E4);

    const history = state.getHistory();
    expect(history).toHaveLength(EXPECTED_HISTORY_LENGTH);
    expect(history[0].before).toBe(START_FEN);
    expect(history[0].after).toBe(EXPECTED_FEN_AFTER_E4);
  });
});
