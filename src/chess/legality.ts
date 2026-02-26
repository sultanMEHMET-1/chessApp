// Chess legality helpers powered by chess.js.
// Provides deterministic legal move lists for a given FEN and source square.
import { Chess, validateFen } from 'chess.js';
import type { Move, Square } from 'chess.js';

export type UciMove = string;

export const legalMovesForSquare = (fen: string, square: Square): UciMove[] => {
  const validation = validateFen(fen);

  if (!validation.ok) {
    throw new Error(`Invalid FEN: ${validation.error ?? fen}`);
  }

  const chess = new Chess(fen);
  const moves = chess.moves({ square, verbose: true }) as Move[];
  const uciMoves = moves.map(moveToUci);

  return uciMoves.sort();
};

const moveToUci = (move: Move): UciMove => {
  if (move.promotion) {
    return `${move.from}${move.to}${move.promotion}`;
  }

  return `${move.from}${move.to}`;
};
