import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

// Wraps chess.js as the single source of truth for position state and legality.
const FEN_FIELD_COUNT = 6;
const HALF_MOVE_CLOCK_FIELD_INDEX = 4;
const MIN_HALF_MOVE_CLOCK_PLY = 0;
const FEN_FIELD_SEPARATOR = /\s+/;

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export type MoveInput = {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
};

export type LegalMove = {
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PromotionPiece;
  san: string;
  lan: string;
  isCapture: boolean;
  isPromotion: boolean;
  isEnPassant: boolean;
  isKingsideCastle: boolean;
  isQueensideCastle: boolean;
  isCastle: boolean;
};

export type MoveRecord = LegalMove & {
  before: string;
  after: string;
};

export type MoveResult =
  | {
      ok: true;
      move: MoveRecord;
      fen: string;
    }
  | {
      ok: false;
      error: string;
    };

export type DrawStatus = {
  threefoldRepetition: boolean;
  fiftyMoveRule: boolean;
  insufficientMaterial: boolean;
};

export class ChessState {
  private readonly chess: Chess;

  constructor(initialFen?: string) {
    this.chess = new Chess(initialFen);
  }

  getFen(): string {
    return this.chess.fen();
  }

  getSideToMove(): Color {
    return this.chess.turn();
  }

  isInCheck(): boolean {
    return this.chess.isCheck();
  }

  getHalfMoveClock(): number {
    return parseHalfMoveClock(this.chess.fen());
  }

  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  isDrawByFiftyMoves(): boolean {
    return this.chess.isDrawByFiftyMoves();
  }

  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  getDrawStatus(): DrawStatus {
    return {
      threefoldRepetition: this.chess.isThreefoldRepetition(),
      fiftyMoveRule: this.chess.isDrawByFiftyMoves(),
      insufficientMaterial: this.chess.isInsufficientMaterial()
    };
  }

  makeMove(input: MoveInput): MoveResult {
    try {
      const move = this.chess.move({
        from: input.from,
        to: input.to,
        promotion: input.promotion
      });

      return {
        ok: true,
        move: toMoveRecord(move),
        fen: this.chess.fen()
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown move error.'
      };
    }
  }

  legalMovesForSquare(square: Square): LegalMove[] {
    const moves = this.chess.moves({ square, verbose: true });
    return moves.map(toLegalMove);
  }

  getHistory(): MoveRecord[] {
    const history = this.chess.history({ verbose: true });
    return history.map(toMoveRecord);
  }
}

function toLegalMove(move: Move): LegalMove {
  const isKingsideCastle = move.isKingsideCastle();
  const isQueensideCastle = move.isQueensideCastle();

  return {
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    captured: move.captured,
    promotion: move.promotion,
    san: move.san,
    lan: move.lan,
    isCapture: move.isCapture(),
    isPromotion: move.isPromotion(),
    isEnPassant: move.isEnPassant(),
    isKingsideCastle,
    isQueensideCastle,
    isCastle: isKingsideCastle || isQueensideCastle
  };
}

function toMoveRecord(move: Move): MoveRecord {
  return {
    ...toLegalMove(move),
    before: move.before,
    after: move.after
  };
}

function parseHalfMoveClock(fen: string): number {
  const fields = fen.trim().split(FEN_FIELD_SEPARATOR);

  if (fields.length !== FEN_FIELD_COUNT) {
    throw new Error(
      `Expected ${FEN_FIELD_COUNT} FEN fields, received ${fields.length}.`
    );
  }

  const rawClock = fields[HALF_MOVE_CLOCK_FIELD_INDEX];
  const clockValue = Number(rawClock);

  if (!Number.isInteger(clockValue) || clockValue < MIN_HALF_MOVE_CLOCK_PLY) {
    throw new Error(`Invalid halfmove clock value: ${rawClock}.`);
  }

  return clockValue;
}
