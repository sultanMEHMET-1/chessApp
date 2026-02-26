import {
  Chess,
  validateFen,
  type Color,
  type Move,
  type PieceSymbol,
  type Square
} from 'chess.js';

// Wraps chess.js as the single source of truth for position state and legality.
const FEN_FIELD_COUNT = 6;
const HALF_MOVE_CLOCK_FIELD_INDEX = 4;
const MIN_HALF_MOVE_CLOCK_PLY = 0;
const FEN_FIELD_SEPARATOR = /\s+/;
const EMPTY_PGN_MESSAGE = 'Paste a PGN to import.';
const INVALID_PGN_MESSAGE =
  'PGN could not be parsed. Check move text like "1. e4 e5".';

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

export type BoardPiece = {
  type: PieceSymbol;
  color: Color;
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

export type FenLoadResult =
  | {
      ok: true;
      fen: string;
    }
  | {
      ok: false;
      error: string;
    };

export type PgnImportResult =
  | {
      ok: true;
      history: MoveRecord[];
      startFen: string;
      finalFen: string;
    }
  | {
      ok: false;
      error: string;
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

  getPiece(square: Square): BoardPiece | null {
    return this.chess.get(square);
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

  loadFen(fen: string): FenLoadResult {
    const trimmed = fen.trim();
    const validation = validateFen(trimmed);

    if (!validation.ok) {
      return {
        ok: false,
        error: `Invalid FEN: ${validation.error ?? trimmed}`
      };
    }

    const loaded = this.chess.load(trimmed);

    if (!loaded) {
      return {
        ok: false,
        error: `Invalid FEN: ${trimmed}`
      };
    }

    return {
      ok: true,
      fen: this.chess.fen()
    };
  }

  loadPgn(rawPgn: string): PgnImportResult {
    const trimmed = rawPgn.trim();

    if (!trimmed) {
      return {
        ok: false,
        error: EMPTY_PGN_MESSAGE
      };
    }

    const candidate = new Chess();

    try {
      candidate.loadPgn(trimmed);
    } catch {
      return {
        ok: false,
        error: INVALID_PGN_MESSAGE
      };
    }

    const history = candidate
      .history({ verbose: true })
      .map(toMoveRecord);
    const startFen = history.length > 0 ? history[0].before : candidate.fen();
    const finalFen = candidate.fen();

    this.chess.loadPgn(trimmed);

    return {
      ok: true,
      history,
      startFen,
      finalFen
    };
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
