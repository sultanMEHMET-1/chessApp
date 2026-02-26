/**
 * FEN parsing and editor helpers for position setup flows.
 */
import { Square, validateFen } from 'chess.js';
import {
  ALL_SQUARES,
  FILES,
  FULL_MOVE_START,
  HALF_MOVE_START,
  RANKS,
  STARTING_FEN
} from './constants';
import type {
  BoardPiece,
  CastlingRights,
  EditorPosition,
  PlayerColor,
  PositionValidation
} from './types';

const CASTLING_NONE = '-';
const EN_PASSANT_NONE = '-';
const FEN_PARTS_COUNT = 6; // FEN standard has 6 fields.
const BOARD_EMPTY_THRESHOLD = 0; // No empty squares counted yet.
const MAX_EMPTY_RUN = 8; // A rank can have up to 8 empty squares.

function createEmptyPieceMap(): Record<Square, BoardPiece | null> {
  return ALL_SQUARES.reduce((accumulator, square) => {
    return { ...accumulator, [square]: null };
  }, {} as Record<Square, BoardPiece | null>);
}

function parseCastlingRights(raw: string): CastlingRights {
  return {
    whiteKingSide: raw.includes('K'),
    whiteQueenSide: raw.includes('Q'),
    blackKingSide: raw.includes('k'),
    blackQueenSide: raw.includes('q')
  };
}

function stringifyCastlingRights(rights: CastlingRights): string {
  const value =
    `${rights.whiteKingSide ? 'K' : ''}` +
    `${rights.whiteQueenSide ? 'Q' : ''}` +
    `${rights.blackKingSide ? 'k' : ''}` +
    `${rights.blackQueenSide ? 'q' : ''}`;

  return value.length > 0 ? value : CASTLING_NONE;
}

function pieceFromFenChar(char: string): BoardPiece {
  const lower = char.toLowerCase();
  const color: PlayerColor = char === lower ? 'b' : 'w';
  return {
    color,
    type: lower as BoardPiece['type']
  };
}

function pieceToFenChar(piece: BoardPiece): string {
  const symbol = piece.type;
  return piece.color === 'w' ? symbol.toUpperCase() : symbol;
}

function parseBoard(fenBoard: string): Record<Square, BoardPiece | null> {
  const pieceMap = createEmptyPieceMap();
  const ranks = fenBoard.split('/');

  if (ranks.length !== RANKS.length) {
    return pieceMap;
  }

  ranks.forEach((rankRow, rankIndex) => {
    let fileIndex = 0;
    for (const char of rankRow) {
      if (fileIndex >= FILES.length) {
        break;
      }
      const parsed = Number(char);
      if (!Number.isNaN(parsed)) {
        fileIndex += parsed;
        continue;
      }
      const file = FILES[fileIndex];
      const rank = RANKS[rankIndex];
      const square = `${file}${rank}` as Square;
      pieceMap[square] = pieceFromFenChar(char);
      fileIndex += 1;
    }
  });

  return pieceMap;
}

function buildBoardString(pieces: Record<Square, BoardPiece | null>): string {
  return RANKS.map((rank) => {
    let emptyRun = BOARD_EMPTY_THRESHOLD;
    let row = '';
    FILES.forEach((file) => {
      const square = `${file}${rank}` as Square;
      const piece = pieces[square];
      if (!piece) {
        emptyRun += 1;
        return;
      }
      if (emptyRun > BOARD_EMPTY_THRESHOLD) {
        row += `${emptyRun}`;
        emptyRun = BOARD_EMPTY_THRESHOLD;
      }
      row += pieceToFenChar(piece);
    });
    if (emptyRun > BOARD_EMPTY_THRESHOLD) {
      row += `${Math.min(emptyRun, MAX_EMPTY_RUN)}`;
    }
    return row;
  }).join('/');
}

function createEditorPositionFromFen(fen: string): EditorPosition {
  const parts = fen.split(' ');
  const safeParts = parts.length === FEN_PARTS_COUNT ? parts : STARTING_FEN.split(' ');
  const [boardPart, turnPart, castlingPart, enPassantPart, halfMovePart, fullMovePart] =
    safeParts;

  return {
    pieces: parseBoard(boardPart),
    turn: (turnPart ?? 'w') as PlayerColor,
    castling: parseCastlingRights(castlingPart ?? CASTLING_NONE),
    enPassant: enPassantPart === EN_PASSANT_NONE ? null : (enPassantPart as EditorPosition['enPassant']),
    halfmoveClock: Number(halfMovePart ?? HALF_MOVE_START),
    fullmoveNumber: Number(fullMovePart ?? FULL_MOVE_START),
    allowIllegal: false
  };
}

function buildFen(position: EditorPosition): string {
  const board = buildBoardString(position.pieces);
  const castling = stringifyCastlingRights(position.castling);
  const enPassant = position.enPassant ?? EN_PASSANT_NONE;
  const halfmove = Math.max(position.halfmoveClock, HALF_MOVE_START);
  const fullmove = Math.max(position.fullmoveNumber, FULL_MOVE_START);

  return `${board} ${position.turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

function countKings(pieces: Record<string, BoardPiece | null>): { white: number; black: number } {
  return Object.values(pieces).reduce(
    (accumulator, piece) => {
      if (!piece || piece.type !== 'k') {
        return accumulator;
      }
      if (piece.color === 'w') {
        return { ...accumulator, white: accumulator.white + 1 };
      }
      return { ...accumulator, black: accumulator.black + 1 };
    },
    { white: 0, black: 0 }
  );
}

function validateEditorPosition(position: EditorPosition): PositionValidation {
  if (position.allowIllegal) {
    return { ok: true };
  }

  const fen = buildFen(position);
  const validation = validateFen(fen);
  if (!validation.ok) {
    return validation;
  }

  const kings = countKings(position.pieces);
  if (kings.white !== 1 || kings.black !== 1) {
    return { ok: false, error: 'Each side must have exactly one king.' };
  }

  return { ok: true };
}

export {
  buildFen,
  createEditorPositionFromFen,
  parseCastlingRights,
  stringifyCastlingRights,
  validateEditorPosition
};
