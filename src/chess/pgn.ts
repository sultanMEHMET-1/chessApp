// PGN serialization helpers for exporting a recorded move list.
import { Chess, validateFen } from 'chess.js';
import type { MoveRecord } from './chessState';

const INVALID_START_FEN_MESSAGE =
  'Cannot export PGN because the starting position is invalid.';
const INVALID_HISTORY_MESSAGE =
  'Cannot export PGN because the move list is inconsistent.';

export type PgnExportResult =
  | {
      ok: true;
      pgn: string;
    }
  | {
      ok: false;
      error: string;
    };

export function exportPgnFromMoves(
  startFen: string,
  moves: MoveRecord[]
): PgnExportResult {
  const trimmedStart = startFen.trim();
  const validation = validateFen(trimmedStart);

  if (!validation.ok) {
    return {
      ok: false,
      error: INVALID_START_FEN_MESSAGE
    };
  }

  const chess = new Chess(trimmedStart);

  for (const move of moves) {
    const applied = chess.move(move.san);

    if (!applied) {
      return {
        ok: false,
        error: INVALID_HISTORY_MESSAGE
      };
    }
  }

  return {
    ok: true,
    pgn: chess.pgn()
  };
}
