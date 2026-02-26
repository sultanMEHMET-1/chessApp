import { describe, expect, it } from 'vitest';
import { PROMOTION_PIECES, STARTING_FEN } from './constants';
import {
  getGameStatus,
  getGameStatusFromHistory,
  getLegalMovesForSquare
} from './rules';
import type { MoveSelection } from './types';

const PINNED_PIECE_FEN = '4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1';
const CASTLING_BLOCKED_FEN = 'r3k2r/8/8/8/2b5/8/8/R3K2R w KQkq - 0 1';
const ILLEGAL_EN_PASSANT_FEN = '4r2k/8/8/3pP3/8/8/8/4K3 w - d6 0 1';
const PROMOTION_FEN = '7k/P7/8/8/8/8/8/4K3 w - - 0 1';

const FIFTY_MOVE_FEN = '8/8/8/8/8/8/8/Kk6 w - - 100 50';
const INSUFFICIENT_MATERIAL_FEN = '8/8/8/8/8/8/8/Kk6 w - - 0 1';

const THREEFOLD_SEQUENCE: MoveSelection[] = [
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' }
];

const MIN_PROMOTIONS = 4; // Promotion must include four choices.

describe('rules engine legality', () => {
  it('excludes pinned piece moves that expose the king', () => {
    const moves = getLegalMovesForSquare(PINNED_PIECE_FEN, 'e2');
    const destinations = moves.map((move) => move.to);

    expect(destinations).toContain('e3');
    expect(destinations).not.toContain('a2');
  });

  it('forbids castling through check', () => {
    const moves = getLegalMovesForSquare(CASTLING_BLOCKED_FEN, 'e1');
    const destinations = moves.map((move) => move.to);

    expect(destinations).not.toContain('g1');
  });

  it('forbids en passant when it exposes the king', () => {
    const moves = getLegalMovesForSquare(ILLEGAL_EN_PASSANT_FEN, 'e5');
    const destinations = moves.map((move) => move.to);

    expect(destinations).not.toContain('d6');
  });

  it('returns four promotion options for a single destination', () => {
    const moves = getLegalMovesForSquare(PROMOTION_FEN, 'a7');
    const promotions = moves.filter((move) => move.to === 'a8');
    const promotionPieces = promotions.map((move) => move.promotion).sort();

    expect(promotions).toHaveLength(MIN_PROMOTIONS);
    expect(promotionPieces).toEqual([...PROMOTION_PIECES].sort());
  });
});

describe('rules engine draw detection', () => {
  it('detects threefold repetition from move history', () => {
    const status = getGameStatusFromHistory(STARTING_FEN, THREEFOLD_SEQUENCE);

    expect(status.isThreefoldRepetition).toBe(true);
  });

  it('detects the fifty-move rule via halfmove clock', () => {
    const status = getGameStatus(FIFTY_MOVE_FEN);

    expect(status.isDrawByFiftyMoves).toBe(true);
  });

  it('detects insufficient material', () => {
    const status = getGameStatus(INSUFFICIENT_MATERIAL_FEN);

    expect(status.isInsufficientMaterial).toBe(true);
  });
});
