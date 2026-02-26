import { describe, expect, it } from 'vitest';
import type { Square } from 'chess.js';

import { legalMovesForSquare } from './legality';

const PINNED_KNIGHT_FEN = 'k3r3/8/8/8/8/8/4N3/4K3 w - - 0 1';
const PINNED_KNIGHT_SQUARE: Square = 'e2';

const CASTLING_THROUGH_CHECK_FEN = 'k4r2/8/8/8/8/8/8/4K2R w K - 0 1';
const CASTLING_KING_SQUARE: Square = 'e1';
const KING_SIDE_CASTLE_MOVE = 'e1g1';
const CASTLING_EXPECTED_MOVES = ['e1d1', 'e1d2', 'e1e2'];

const EN_PASSANT_EXPOSES_KING_FEN = 'k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1';
const EN_PASSANT_PAWN_SQUARE: Square = 'e5';
const ILLEGAL_EN_PASSANT_MOVE = 'e5d6';
const EN_PASSANT_EXPECTED_MOVES = ['e5e6'];

const PROMOTION_FEN = '7k/P7/8/8/8/8/8/7K w - - 0 1';
const PROMOTION_PAWN_SQUARE: Square = 'a7';
const PROMOTION_EXPECTED_MOVES = ['a7a8b', 'a7a8n', 'a7a8q', 'a7a8r'];
const PROMOTION_MOVE_COUNT = PROMOTION_EXPECTED_MOVES.length;

describe('legalMovesForSquare', () => {
  it('omits moves for a pinned piece that would expose the king', () => {
    const moves = legalMovesForSquare(PINNED_KNIGHT_FEN, PINNED_KNIGHT_SQUARE);

    expect(moves).toEqual([]);
  });

  it('rejects castling through check', () => {
    const moves = legalMovesForSquare(CASTLING_THROUGH_CHECK_FEN, CASTLING_KING_SQUARE);

    expect(moves).toEqual(CASTLING_EXPECTED_MOVES);
    expect(moves).not.toContain(KING_SIDE_CASTLE_MOVE);
  });

  it('rejects en passant if it exposes the king', () => {
    const moves = legalMovesForSquare(EN_PASSANT_EXPOSES_KING_FEN, EN_PASSANT_PAWN_SQUARE);

    expect(moves).toEqual(EN_PASSANT_EXPECTED_MOVES);
    expect(moves).not.toContain(ILLEGAL_EN_PASSANT_MOVE);
  });

  it('returns all promotion options', () => {
    const moves = legalMovesForSquare(PROMOTION_FEN, PROMOTION_PAWN_SQUARE);

    expect(moves).toEqual(PROMOTION_EXPECTED_MOVES);
    expect(moves).toHaveLength(PROMOTION_MOVE_COUNT);
  });
});
