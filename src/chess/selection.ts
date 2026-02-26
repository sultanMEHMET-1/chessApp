import type { Square } from 'chess.js';
import type { MoveInput, MoveResult } from './chessState';
import { ChessState } from './chessState';

// Minimal wiring for UI selection and move application using the chess state core.
export function getLegalDestinations(
  state: ChessState,
  square: Square
): Square[] {
  return state.legalMovesForSquare(square).map((move) => move.to);
}

export function applyMove(state: ChessState, input: MoveInput): MoveResult {
  return state.makeMove(input);
}
