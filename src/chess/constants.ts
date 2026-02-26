import type { Square } from 'chess.js';

const BOARD_DIMENSION = 8; // Standard chess board is 8x8 squares.

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const PROMOTION_PIECES = ['q', 'r', 'b', 'n'] as const;

const ALL_SQUARES = FILES.flatMap((file) =>
  RANKS.map((rank) => `${file}${rank}` as Square)
);

const HALF_MOVE_START = 0; // Halfmove clock starts at 0 for a fresh position.
const FULL_MOVE_START = 1; // Fullmove counter starts at 1 for a fresh position.

export {
  ALL_SQUARES,
  BOARD_DIMENSION,
  FILES,
  FULL_MOVE_START,
  HALF_MOVE_START,
  PROMOTION_PIECES,
  RANKS,
  STARTING_FEN
};
