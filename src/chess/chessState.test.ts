import { describe, expect, it } from 'vitest';
import { ChessState, type MoveInput } from './chessState';
import type { Square } from 'chess.js';

const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const ILLEGAL_MOVE: MoveInput = { from: 'e2', to: 'e5' };
const PINNED_ROOK_FEN = 'k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1';
const PINNED_ROOK_SQUARE: Square = 'e2';
const PINNED_ILLEGAL_DESTINATION: Square = 'a2';
const CASTLING_THROUGH_CHECK_FEN = 'r3k2r/8/8/8/2b5/8/8/R3K2R w KQkq - 0 1';
const CASTLING_KING_SQUARE: Square = 'e1';
const CASTLING_DESTINATION: Square = 'g1';
const EN_PASSANT_EXPOSES_KING_FEN = 'k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1';
const EN_PASSANT_PAWN_SQUARE: Square = 'e5';
const EN_PASSANT_DESTINATION: Square = 'd6';
const PROMOTION_FEN = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1';
const PROMOTION_PAWN_SQUARE: Square = 'a7';
const PROMOTION_DESTINATION: Square = 'a8';
const EXPECTED_PROMOTION_COUNT = 4;
const THREEFOLD_SEQUENCE: MoveInput[] = [
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' }
];
const FIFTY_MOVE_FEN = '8/8/8/8/8/8/8/4K2k w - - 100 1';
const FIFTY_MOVE_HALF_MOVE_CLOCK = 100;
const INSUFFICIENT_MATERIAL_FEN = '8/8/8/8/8/8/8/4K2k w - - 0 1';
const EMPTY_PGN = '   ';
const INVALID_PGN = '1. e4 e5 2. Qz4';
const VALID_PGN = '1. e4 e5 2. Nf3 Nc6';
const EXPECTED_PGN_HISTORY_LENGTH = 4;
const EMPTY_PGN_ERROR = 'Paste a PGN to import.';
const INVALID_PGN_ERROR =
  'PGN could not be parsed. Check move text like "1. e4 e5".';

function expectMoveOk(state: ChessState, input: MoveInput): void {
  const result = state.makeMove(input);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected move to be legal: ${result.error}`);
  }
}

describe('ChessState', () => {
  it('rejects illegal moves', () => {
    const state = new ChessState();
    const result = state.makeMove(ILLEGAL_MOVE);

    expect(result.ok).toBe(false);
  });

  it('filters out pseudo-legal moves that expose the king', () => {
    const state = new ChessState(PINNED_ROOK_FEN);
    const moves = state.legalMovesForSquare(PINNED_ROOK_SQUARE);
    const destinations = moves.map((move) => move.to);

    expect(destinations).not.toContain(PINNED_ILLEGAL_DESTINATION);
  });

  it('disallows castling through check', () => {
    const state = new ChessState(CASTLING_THROUGH_CHECK_FEN);
    const moves = state.legalMovesForSquare(CASTLING_KING_SQUARE);
    const destinations = moves.map((move) => move.to);

    expect(destinations).not.toContain(CASTLING_DESTINATION);
  });

  it('disallows en passant that exposes the king', () => {
    const state = new ChessState(EN_PASSANT_EXPOSES_KING_FEN);
    const moves = state.legalMovesForSquare(EN_PASSANT_PAWN_SQUARE);
    const destinations = moves.map((move) => move.to);

    expect(destinations).not.toContain(EN_PASSANT_DESTINATION);
  });

  it('returns four promotion choices for a pawn on the seventh rank', () => {
    const state = new ChessState(PROMOTION_FEN);
    const moves = state.legalMovesForSquare(PROMOTION_PAWN_SQUARE);
    const promotions = moves
      .filter((move) => move.to === PROMOTION_DESTINATION)
      .map((move) => move.promotion)
      .filter((promotion): promotion is NonNullable<typeof promotion> =>
        Boolean(promotion)
      );

    expect(promotions).toHaveLength(EXPECTED_PROMOTION_COUNT);
    expect(new Set(promotions)).toEqual(new Set(['q', 'r', 'b', 'n']));
  });

  it('detects threefold repetition', () => {
    const state = new ChessState(START_FEN);

    THREEFOLD_SEQUENCE.forEach((move) => {
      expectMoveOk(state, move);
    });

    expect(state.isThreefoldRepetition()).toBe(true);
  });

  it('detects the fifty-move rule and exposes the clock', () => {
    const state = new ChessState(FIFTY_MOVE_FEN);

    expect(state.getHalfMoveClock()).toBe(FIFTY_MOVE_HALF_MOVE_CLOCK);
    expect(state.isDrawByFiftyMoves()).toBe(true);
  });

  it('detects insufficient material draws', () => {
    const state = new ChessState(INSUFFICIENT_MATERIAL_FEN);

    expect(state.isInsufficientMaterial()).toBe(true);
  });

  it('rejects empty PGN imports with a helpful message', () => {
    const state = new ChessState();
    const result = state.loadPgn(EMPTY_PGN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(EMPTY_PGN_ERROR);
    }
  });

  it('rejects invalid PGN imports with a helpful message', () => {
    const state = new ChessState();
    const result = state.loadPgn(INVALID_PGN);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(INVALID_PGN_ERROR);
    }
  });

  it('accepts valid PGN imports and captures the history', () => {
    const state = new ChessState();
    const result = state.loadPgn(VALID_PGN);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.history).toHaveLength(EXPECTED_PGN_HISTORY_LENGTH);
    }
  });
});
