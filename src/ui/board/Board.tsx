// Interactive chessboard UI wired to ChessState for legal move selection and status display.
import { useEffect, useMemo, useState } from "react";
import type { Color, PieceSymbol, Square } from "chess.js";
import {
  ChessState,
  type BoardPiece,
  type LegalMove,
  type MoveRecord,
  type PromotionPiece
} from "../../chess/chessState";
import { applyMove } from "../../chess/selection";
import styles from "./Board.module.css";

type BoardSquare = {
  square: Square;
  isDark: boolean;
};

const BOARD_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const BOARD_RANKS_DESC = [
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1"
] as const;
const CHECKERBOARD_MODULO = 2;
const DARK_SQUARE_PARITY = 1;
const DEFAULT_PROMOTION: PromotionPiece = "q";

const SIDE_LABELS: Record<Color, string> = {
  w: "White",
  b: "Black"
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King"
};

const PIECE_LETTERS: Record<PieceSymbol, string> = {
  p: "P",
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K"
};

const BOARD_SQUARES: BoardSquare[] = BOARD_RANKS_DESC.flatMap(
  (rank, rankIndex) =>
    BOARD_FILES.map((file, fileIndex) => {
      const square = `${file}${rank}` as Square;
      const isDark =
        (fileIndex + rankIndex) % CHECKERBOARD_MODULO === DARK_SQUARE_PARITY;

      return {
        square,
        isDark
      };
    })
);

const MOVE_ERROR_MESSAGE = "That move is not legal for the current position.";

type BoardProps = {
  initialFen?: string;
  state?: ChessState;
  positionVersion?: number;
  lastMove?: {
    from: Square;
    to: Square;
  } | null;
  onMoveApplied?: (move: MoveRecord) => void;
};

export function Board({
  initialFen,
  state,
  positionVersion,
  lastMove,
  onMoveApplied
}: BoardProps) {
  const [chessState] = useState(() => state ?? new ChessState(initialFen));
  const [fen, setFen] = useState(() => chessState.getFen());
  const [sideToMove, setSideToMove] = useState(() => chessState.getSideToMove());
  const [isCheck, setIsCheck] = useState(() => chessState.isInCheck());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [internalLastMove, setInternalLastMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedLastMove =
    lastMove === undefined ? internalLastMove : lastMove;

  const legalDestinations = useMemo(
    () => new Set(legalMoves.map((move) => move.to)),
    [legalMoves]
  );

  useEffect(() => {
    if (positionVersion === undefined) {
      return;
    }

    setFen(chessState.getFen());
    setSideToMove(chessState.getSideToMove());
    setIsCheck(chessState.isInCheck());
    setSelectedSquare(null);
    setLegalMoves([]);
    setErrorMessage(null);
    if (lastMove !== undefined) {
      setInternalLastMove(lastMove);
    }
  }, [positionVersion, lastMove, chessState]);

  const refreshStatus = () => {
    setFen(chessState.getFen());
    setSideToMove(chessState.getSideToMove());
    setIsCheck(chessState.isInCheck());
  };

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const selectSquare = (square: Square) => {
    setSelectedSquare(square);
    setLegalMoves(chessState.legalMovesForSquare(square));
  };

  const applySelectedMove = (destination: Square) => {
    if (!selectedSquare) {
      return;
    }

    const candidateMoves = legalMoves.filter((move) => move.to === destination);
    const promotion = pickPromotion(candidateMoves);
    const result = applyMove(chessState, {
      from: selectedSquare,
      to: destination,
      promotion
    });

    if (!result.ok) {
      setErrorMessage(MOVE_ERROR_MESSAGE);
      return;
    }

    const appliedLastMove = { from: result.move.from, to: result.move.to };
    setInternalLastMove(appliedLastMove);
    refreshStatus();
    clearSelection();
    setErrorMessage(null);
    onMoveApplied?.(result.move);
  };

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      if (square === selectedSquare) {
        clearSelection();
        return;
      }

      if (legalDestinations.has(square)) {
        applySelectedMove(square);
        return;
      }
    }

    const piece = chessState.getPiece(square);

    if (piece && piece.color === sideToMove) {
      selectSquare(square);
      setErrorMessage(null);
      return;
    }

    clearSelection();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.boardWrapper}>
        <div className={styles.board} role="grid" aria-label="Chess board">
          {BOARD_SQUARES.map((squareData) => {
            const piece = chessState.getPiece(squareData.square);
            const isSelected = selectedSquare === squareData.square;
            const isLegalDestination = legalDestinations.has(squareData.square);
            const isLastMove =
              resolvedLastMove?.from === squareData.square ||
              resolvedLastMove?.to === squareData.square;
            const className = [
              styles.square,
              squareData.isDark ? styles.darkSquare : styles.lightSquare,
              isSelected ? styles.selected : "",
              isLastMove ? styles.lastMove : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={squareData.square}
                type="button"
                className={className}
                onClick={() => handleSquareClick(squareData.square)}
                aria-pressed={isSelected}
                aria-label={buildSquareLabel(squareData.square, piece)}
                data-square={squareData.square}
                data-testid={`square-${squareData.square}`}
                data-legal-destination={
                  isLegalDestination ? "true" : undefined
                }
                data-last-move={isLastMove ? "true" : undefined}
              >
                {piece ? (
                  <span
                    className={styles.piece}
                    data-color={piece.color}
                    aria-hidden="true"
                  >
                    {renderPieceLetter(piece)}
                  </span>
                ) : null}
                {isLegalDestination ? (
                  <span className={styles.legalIndicator} aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.statusPanel} aria-live="polite">
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Side to move</span>
          <span className={styles.statusValue} data-testid="side-to-move">
            {SIDE_LABELS[sideToMove]}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Check</span>
          <span className={styles.statusValue} data-testid="check-status">
            {isCheck ? "Yes" : "No"}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>FEN</span>
          <span className={styles.fenValue} data-testid="fen-value">
            {fen}
          </span>
        </div>
      </div>

      {errorMessage ? (
        <p className={styles.errorBanner} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function pickPromotion(moves: LegalMove[]): PromotionPiece | undefined {
  const promotionMoves = moves.filter(
    (move) => move.isPromotion && move.promotion
  );

  if (promotionMoves.length === 0) {
    return undefined;
  }

  // Default to queen until a promotion picker is implemented.
  const preferred = promotionMoves.find(
    (move) => move.promotion === DEFAULT_PROMOTION
  );

  return (preferred ?? promotionMoves[0]).promotion;
}

function renderPieceLetter(piece: BoardPiece): string {
  const base = PIECE_LETTERS[piece.type];
  return piece.color === "w" ? base : base.toLowerCase();
}

function buildSquareLabel(square: Square, piece: BoardPiece | null): string {
  if (!piece) {
    return `Square ${square}`;
  }

  const colorLabel = SIDE_LABELS[piece.color];
  const pieceLabel = PIECE_NAMES[piece.type];

  return `Square ${square}, ${colorLabel} ${pieceLabel}`;
}
