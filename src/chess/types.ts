/**
 * Shared chess domain types for rules and UI integration.
 */
import type { PieceSymbol, Square } from 'chess.js';

type PlayerColor = 'w' | 'b';

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

type BoardPiece = {
  color: PlayerColor;
  type: PieceSymbol;
};

type LegalMove = {
  from: Square;
  to: Square;
  san: string;
  flags: string;
  piece: PieceSymbol;
  color: PlayerColor;
  captured?: PieceSymbol;
  promotion?: PromotionPiece;
};

type MoveSelection = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
};

type MoveResult = {
  fen: string;
  lastMove: LastMove;
  san: string;
  move: LegalMove;
};

type LastMove = {
  from: Square;
  to: Square;
  san: string;
  promotion?: PromotionPiece;
};

type GameStatus = {
  turn: PlayerColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isDrawByFiftyMoves: boolean;
  isThreefoldRepetition: boolean;
  isInsufficientMaterial: boolean;
};

type PositionValidation = {
  ok: boolean;
  error?: string;
};

type CastlingRights = {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
};

type EditorPosition = {
  pieces: Record<Square, BoardPiece | null>;
  turn: PlayerColor;
  castling: CastlingRights;
  enPassant: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  allowIllegal: boolean;
};

export type {
  BoardPiece,
  CastlingRights,
  EditorPosition,
  GameStatus,
  LastMove,
  LegalMove,
  MoveResult,
  MoveSelection,
  PlayerColor,
  PositionValidation,
  PromotionPiece
};
