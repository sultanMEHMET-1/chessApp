/**
 * Chess rules facade backed by chess.js for deterministic legality queries.
 */
import { Chess, Move, Square, validateFen } from 'chess.js';
import { ALL_SQUARES, STARTING_FEN } from './constants';
import type {
  BoardPiece,
  GameStatus,
  HistorySnapshot,
  LastMove,
  LegalMove,
  MoveResult,
  MoveSelection,
  PgnImportResult,
  PositionValidation,
  PromotionPiece
} from './types';

const PROMOTION_DEFAULT: PromotionPiece = 'q';

function ensureValidFen(fen: string): PositionValidation {
  return validateFen(fen);
}

function createGameFromFen(fen: string = STARTING_FEN): Chess {
  const validation = ensureValidFen(fen);
  if (!validation.ok) {
    const message = validation.error ?? 'Invalid FEN provided.';
    throw new Error(message);
  }
  return new Chess(fen);
}

function createGameFromHistory(initialFen: string, moves: MoveSelection[]): Chess {
  const game = createGameFromFen(initialFen);
  moves.forEach((move) => {
    const applied = game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });
    if (!applied) {
      throw new Error('Move history contains an illegal move.');
    }
  });
  return game;
}

function toLegalMove(move: Move): LegalMove {
  return {
    from: move.from,
    to: move.to,
    san: move.san,
    flags: move.flags,
    piece: move.piece,
    color: move.color,
    captured: move.captured,
    promotion: move.promotion as PromotionPiece | undefined
  };
}

function toMoveSelection(move: Move): MoveSelection {
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion as PromotionPiece | undefined
  };
}

function getLegalMovesForSquare(fen: string, square: Square): LegalMove[] {
  const game = createGameFromFen(fen);
  return game
    .moves({ square, verbose: true })
    .map((move) => toLegalMove(move));
}

function getBoardPieces(fen: string): Record<Square, BoardPiece | null> {
  const game = createGameFromFen(fen);
  return ALL_SQUARES.reduce((accumulator, square) => {
    const piece = game.get(square);
    return {
      ...accumulator,
      [square]: piece ? { color: piece.color, type: piece.type } : null
    };
  }, {} as Record<Square, BoardPiece | null>);
}

function getGameStatus(fen: string): GameStatus {
  const game = createGameFromFen(fen);
  return {
    turn: game.turn(),
    isCheck: game.isCheck(),
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw: game.isDraw(),
    isDrawByFiftyMoves: game.isDrawByFiftyMoves(),
    isThreefoldRepetition: game.isThreefoldRepetition(),
    isInsufficientMaterial: game.isInsufficientMaterial()
  };
}

function getGameStatusFromHistory(initialFen: string, moves: MoveSelection[]): GameStatus {
  const game = createGameFromHistory(initialFen, moves);
  return {
    turn: game.turn(),
    isCheck: game.isCheck(),
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw: game.isDraw(),
    isDrawByFiftyMoves: game.isDrawByFiftyMoves(),
    isThreefoldRepetition: game.isThreefoldRepetition(),
    isInsufficientMaterial: game.isInsufficientMaterial()
  };
}

function getFenFromHistory(initialFen: string, moves: MoveSelection[]): string {
  return createGameFromHistory(initialFen, moves).fen();
}

function getSanHistoryFromHistory(initialFen: string, moves: MoveSelection[]): string[] {
  return createGameFromHistory(initialFen, moves).history();
}

function buildHistorySnapshot(game: Chess): HistorySnapshot {
  const history = game.history({ verbose: true }).map((move) => toMoveSelection(move));
  const san = game.history();
  const lastMove = history.length
    ? {
        from: history[history.length - 1].from,
        to: history[history.length - 1].to,
        san: san[san.length - 1] ?? '',
        promotion: history[history.length - 1].promotion
      }
    : undefined;

  return {
    moves: history,
    san,
    fen: game.fen(),
    lastMove
  };
}

function applyMoveToHistory(
  initialFen: string,
  moves: MoveSelection[],
  move: MoveSelection
): HistorySnapshot | null {
  const game = createGameFromHistory(initialFen, moves);
  const applied = game.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion
  });
  if (!applied) {
    return null;
  }
  return buildHistorySnapshot(game);
}

function importPgn(pgn: string, initialFen: string = STARTING_FEN): PgnImportResult {
  const game = createGameFromFen(initialFen);
  try {
    game.loadPgn(pgn, { strict: true });
  } catch (error) {
    return {
      moves: [],
      san: [],
      fen: initialFen,
      error: error instanceof Error ? error.message : 'Invalid PGN input.'
    };
  }
  const snapshot = buildHistorySnapshot(game);
  return {
    moves: snapshot.moves,
    san: snapshot.san,
    fen: snapshot.fen
  };
}

function exportPgn(initialFen: string, moves: MoveSelection[]): string {
  const game = createGameFromHistory(initialFen, moves);
  return game.pgn();
}

function applyMove(fen: string, move: MoveSelection): MoveResult | null {
  const game = createGameFromFen(fen);
  const applied = game.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion
  });

  if (!applied) {
    return null;
  }

  const legalMove = toLegalMove(applied);
  const lastMove: LastMove = {
    from: legalMove.from,
    to: legalMove.to,
    san: legalMove.san,
    promotion: legalMove.promotion
  };

  return {
    fen: game.fen(),
    lastMove,
    san: legalMove.san,
    move: legalMove
  };
}

function normalizePromotionSelection(moves: LegalMove[], to: Square): MoveSelection | null {
  const candidateMoves = moves.filter((move) => move.to === to);
  if (candidateMoves.length === 0) {
    return null;
  }

  const preferredPromotion = candidateMoves.find(
    (move) => move.promotion === PROMOTION_DEFAULT
  );

  const move = preferredPromotion ?? candidateMoves[0];
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion
  };
}

export {
  applyMove,
  applyMoveToHistory,
  createGameFromFen,
  createGameFromHistory,
  ensureValidFen,
  exportPgn,
  getBoardPieces,
  getGameStatus,
  getGameStatusFromHistory,
  getFenFromHistory,
  getLegalMovesForSquare,
  getSanHistoryFromHistory,
  importPgn,
  normalizePromotionSelection
};
