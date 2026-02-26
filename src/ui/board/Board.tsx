// Interactive chessboard UI with optional controlled and uncontrolled modes.
import { useMemo, useState } from 'react';
import type { Color, PieceSymbol, Square } from 'chess.js';
import {
  ChessState,
  type LegalMove as StateLegalMove,
  type PromotionPiece
} from '../../chess/chessState';
import { applyMove } from '../../chess/selection';
import type { BoardPiece, LastMove } from '../../chess/types';
import styles from './Board.module.css';

type ControlledBoardProps = {
  pieces: Record<Square, BoardPiece | null>;
  selectedSquare: Square | null;
  legalDestinations: Set<Square>;
  lastMove?: LastMove;
  onSquareClick: (square: Square) => void;
};

type UncontrolledBoardProps = {
  initialFen?: string;
};

type BoardProps = ControlledBoardProps | UncontrolledBoardProps;

type BoardSquare = {
  square: Square;
  isDark: boolean;
};

const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const BOARD_RANKS_DESC = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
const CHECKERBOARD_MODULO = 2;
const DARK_SQUARE_PARITY = 1;
const DEFAULT_PROMOTION: PromotionPiece = 'q';

const SIDE_LABELS: Record<Color, string> = {
  w: 'White',
  b: 'Black'
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King'
};

const PIECE_LETTERS: Record<PieceSymbol, string> = {
  p: 'P',
  n: 'N',
  b: 'B',
  r: 'R',
  q: 'Q',
  k: 'K'
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

const MOVE_ERROR_MESSAGE = 'That move is not legal for the current position.';

export function Board(props: BoardProps) {
  const isControlled = 'pieces' in props;
  const initialFen = !isControlled ? props.initialFen : undefined;

  const [chessState] = useState(() => new ChessState(initialFen));
  const [fen, setFen] = useState(() => chessState.getFen());
  const [sideToMove, setSideToMove] = useState(() => chessState.getSideToMove());
  const [isCheck, setIsCheck] = useState(() => chessState.isInCheck());
  const [internalSelectedSquare, setInternalSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<StateLegalMove[]>([]);
  const [internalLastMove, setInternalLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const internalLegalDestinations = useMemo(
    () => new Set(legalMoves.map((move) => move.to)),
    [legalMoves]
  );

  const legalDestinations = isControlled
    ? props.legalDestinations
    : internalLegalDestinations;
  const selectedSquare = isControlled
    ? props.selectedSquare
    : internalSelectedSquare;
  const lastMove = isControlled ? props.lastMove : internalLastMove ?? undefined;

  const refreshStatus = () => {
    setFen(chessState.getFen());
    setSideToMove(chessState.getSideToMove());
    setIsCheck(chessState.isInCheck());
  };

  const clearSelection = () => {
    setInternalSelectedSquare(null);
    setLegalMoves([]);
  };

  const selectSquare = (square: Square) => {
    setInternalSelectedSquare(square);
    setLegalMoves(chessState.legalMovesForSquare(square));
  };

  const applySelectedMove = (destination: Square) => {
    if (!internalSelectedSquare) {
      return;
    }

    const candidateMoves = legalMoves.filter((move) => move.to === destination);
    const promotion = pickPromotion(candidateMoves);
    const result = applyMove(chessState, {
      from: internalSelectedSquare,
      to: destination,
      promotion
    });

    if (!result.ok) {
      setErrorMessage(MOVE_ERROR_MESSAGE);
      return;
    }

    setInternalLastMove({ from: result.move.from, to: result.move.to });
    refreshStatus();
    clearSelection();
    setErrorMessage(null);
  };

  const handleInternalSquareClick = (square: Square) => {
    if (internalSelectedSquare) {
      if (square === internalSelectedSquare) {
        clearSelection();
        return;
      }

      if (internalLegalDestinations.has(square)) {
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

  const handleSquareClick = (square: Square) => {
    if (isControlled) {
      props.onSquareClick(square);
      return;
    }

    handleInternalSquareClick(square);
  };

  const renderBoard = () => (
    <div className={styles.board} role="grid" aria-label="Chess board">
      {BOARD_SQUARES.map((squareData) => {
        const piece = isControlled
          ? props.pieces[squareData.square]
          : chessState.getPiece(squareData.square);
        const isSelected = selectedSquare === squareData.square;
        const isLegalDestination = legalDestinations.has(squareData.square);
        const isLastMove =
          lastMove?.from === squareData.square || lastMove?.to === squareData.square;

        const className = [
          styles.square,
          squareData.isDark ? styles.darkSquare : styles.lightSquare,
          isSelected ? styles.selected : '',
          isLastMove ? styles.lastMove : ''
        ]
          .filter(Boolean)
          .join(' ');

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
            data-legal-destination={isLegalDestination ? 'true' : undefined}
            data-last-move={isLastMove ? 'true' : undefined}
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
  );

  if (isControlled) {
    return renderBoard();
  }

  return (
    <div className={styles.panel}>
      <div className={styles.boardWrapper}>{renderBoard()}</div>

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
            {isCheck ? 'Yes' : 'No'}
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

export default Board;

function pickPromotion(moves: StateLegalMove[]): PromotionPiece | undefined {
  const promotionMoves = moves.filter(
    (move) => move.isPromotion && move.promotion
  );

  if (promotionMoves.length === 0) {
    return undefined;
  }

  const preferred = promotionMoves.find(
    (move) => move.promotion === DEFAULT_PROMOTION
  );

  return (preferred ?? promotionMoves[0]).promotion;
}

function renderPieceLetter(piece: BoardPiece): string {
  const base = PIECE_LETTERS[piece.type];
  return piece.color === 'w' ? base : base.toLowerCase();
}

function buildSquareLabel(square: Square, piece: BoardPiece | null): string {
  if (!piece) {
    return `Square ${square}`;
  }

  const colorLabel = SIDE_LABELS[piece.color];
  const pieceLabel = PIECE_NAMES[piece.type];

  return `Square ${square}, ${colorLabel} ${pieceLabel}`;
}
