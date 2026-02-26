// Interactive chessboard UI with optional controlled and uncontrolled modes.
import { useMemo, useState } from 'react';
import type { Color, PieceSymbol, Square } from 'chess.js';
import {
  ChessState,
  type LegalMove as StateLegalMove,
  type MoveRecord,
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

type MoveRow = {
  moveNumber: number;
  whiteMove: MoveRecord;
  blackMove?: MoveRecord;
  whitePly: number;
  blackPly?: number;
};

const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const BOARD_RANKS_DESC = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
const CHECKERBOARD_MODULO = 2;
const DARK_SQUARE_PARITY = 1;
const DEFAULT_PROMOTION: PromotionPiece = 'q';

const START_PLY_INDEX = 0;
const START_HISTORY_INDEX = 0;
const SINGLE_PLY = 1;
const PLIES_PER_FULL_MOVE = 2;
const FIRST_FULL_MOVE_NUMBER = 1;
const FIRST_PLY_NUMBER = 1;
const WHITE_PLY_OFFSET = 0;
const BLACK_PLY_OFFSET = 1;

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
const HISTORY_TITLE = 'Move History';
const HISTORY_EMPTY_MESSAGE = 'No moves yet.';
const HISTORY_STATUS_LATEST = 'Latest position.';
const HISTORY_STATUS_START =
  'Viewing start position. Return to latest to make moves.';
const HISTORY_STATUS_VIEWING_PREFIX = 'Viewing move';
const HISTORY_STATUS_VIEWING_INFIX = 'of';
const HISTORY_STATUS_VIEWING_SUFFIX = 'Return to latest to make moves.';
const NAV_START_LABEL = 'Start';
const NAV_BACK_LABEL = 'Back';
const NAV_FORWARD_LABEL = 'Forward';
const NAV_END_LABEL = 'End';
const MOVE_NAVIGATION_LABEL = 'Move navigation';
const MOVE_HISTORY_LABEL = 'Move history';
const PENDING_MOVE_LABEL = '--';
const MOVE_BUTTON_TEST_ID_PREFIX = 'move';

export function Board(props: BoardProps) {
  const isControlled = 'pieces' in props;
  const initialFen = !isControlled ? props.initialFen : undefined;

  const [chessState] = useState(() => new ChessState(initialFen));
  const [startFen] = useState(() => chessState.getFen());
  const [currentPly, setCurrentPly] = useState(() => START_PLY_INDEX);
  const [internalSelectedSquare, setInternalSelectedSquare] =
    useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<StateLegalMove[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const history = chessState.getHistory();
  const latestPly = history.length;
  const isViewingLatest = currentPly === latestPly;

  const viewFen =
    currentPly === START_PLY_INDEX
      ? startFen
      : history[currentPly - SINGLE_PLY]?.after ?? startFen;
  const viewState = useMemo(() => new ChessState(viewFen), [viewFen]);
  const sideToMove = viewState.getSideToMove();
  const isCheck = viewState.isInCheck();
  const fen = viewState.getFen();
  const lastMove =
    currentPly === START_PLY_INDEX
      ? null
      : history[currentPly - SINGLE_PLY] ?? null;

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
  const lastMoveHighlight = isControlled ? props.lastMove : lastMove ?? undefined;

  const clearSelection = () => {
    setInternalSelectedSquare(null);
    setLegalMoves([]);
  };

  const selectSquare = (square: Square) => {
    setInternalSelectedSquare(square);
    setLegalMoves(chessState.legalMovesForSquare(square));
  };

  const goToPly = (targetPly: number) => {
    const clampedPly = Math.min(
      Math.max(targetPly, START_PLY_INDEX),
      latestPly
    );
    setCurrentPly(clampedPly);
    clearSelection();
    setErrorMessage(null);
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

    setCurrentPly(chessState.getHistory().length);
    clearSelection();
    setErrorMessage(null);
  };

  const handleUncontrolledSquareClick = (square: Square) => {
    if (!isViewingLatest) {
      return;
    }

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

    const piece = viewState.getPiece(square);

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

    handleUncontrolledSquareClick(square);
  };

  const renderBoard = (
    pieceAt: (square: Square) => BoardPiece | null,
    isDisabled: boolean
  ) => (
    <div className={styles.board} role="grid" aria-label="Chess board">
      {BOARD_SQUARES.map((squareData) => {
        const piece = pieceAt(squareData.square);
        const isSelected = selectedSquare === squareData.square;
        const isLegalDestination = legalDestinations.has(squareData.square);
        const isLastMove =
          lastMoveHighlight?.from === squareData.square ||
          lastMoveHighlight?.to === squareData.square;

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
            disabled={isDisabled}
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
    return renderBoard((square) => props.pieces[square], false);
  }

  const moveRows = buildMoveRows(history);
  const historyStatus = buildHistoryStatus(currentPly, latestPly);
  const canNavigateBack = currentPly > START_PLY_INDEX;
  const canNavigateForward = currentPly < latestPly;

  return (
    <div className={styles.panel}>
      <div className={styles.boardWrapper}>
        {renderBoard((square) => viewState.getPiece(square), !isViewingLatest)}
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

      <section className={styles.historyPanel} aria-label={MOVE_HISTORY_LABEL}>
        <div className={styles.historyHeader}>
          <div>
            <h3 className={styles.historyTitle}>{HISTORY_TITLE}</h3>
            <p className={styles.historyStatus} data-testid="history-status">
              {historyStatus}
            </p>
          </div>
          <div className={styles.historyNav} role="group" aria-label={MOVE_NAVIGATION_LABEL}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goToPly(START_PLY_INDEX)}
              disabled={!canNavigateBack}
              data-testid="nav-start"
            >
              {NAV_START_LABEL}
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goToPly(currentPly - SINGLE_PLY)}
              disabled={!canNavigateBack}
              data-testid="nav-back"
            >
              {NAV_BACK_LABEL}
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goToPly(currentPly + SINGLE_PLY)}
              disabled={!canNavigateForward}
              data-testid="nav-forward"
            >
              {NAV_FORWARD_LABEL}
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goToPly(latestPly)}
              disabled={!canNavigateForward}
              data-testid="nav-end"
            >
              {NAV_END_LABEL}
            </button>
          </div>
        </div>

        {moveRows.length === START_PLY_INDEX ? (
          <p className={styles.historyEmpty}>{HISTORY_EMPTY_MESSAGE}</p>
        ) : (
          <ol className={styles.historyList} data-testid="move-history">
            {moveRows.map((row) => {
              const isWhiteCurrent = currentPly === row.whitePly;
              const isBlackCurrent = currentPly === row.blackPly;
              const whiteClassName = [
                styles.moveButton,
                isWhiteCurrent ? styles.currentMove : ''
              ]
                .filter(Boolean)
                .join(' ');
              const blackClassName = [
                styles.moveButton,
                isBlackCurrent ? styles.currentMove : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li key={row.moveNumber} className={styles.historyRow}>
                  <span className={styles.moveNumber}>{row.moveNumber}.</span>
                  <button
                    type="button"
                    className={whiteClassName}
                    onClick={() => goToPly(row.whitePly)}
                    data-testid={`${MOVE_BUTTON_TEST_ID_PREFIX}-${row.whitePly}`}
                    aria-current={isWhiteCurrent ? 'true' : undefined}
                  >
                    {row.whiteMove.san}
                  </button>
                  {row.blackMove && row.blackPly ? (
                    <button
                      type="button"
                      className={blackClassName}
                      onClick={() => goToPly(row.blackPly)}
                      data-testid={`${MOVE_BUTTON_TEST_ID_PREFIX}-${row.blackPly}`}
                      aria-current={isBlackCurrent ? 'true' : undefined}
                    >
                      {row.blackMove.san}
                    </button>
                  ) : (
                    <span className={styles.pendingMove}>{PENDING_MOVE_LABEL}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

export default Board;

function buildMoveRows(history: MoveRecord[]): MoveRow[] {
  const rows: MoveRow[] = [];

  for (
    let index = START_HISTORY_INDEX;
    index < history.length;
    index += PLIES_PER_FULL_MOVE
  ) {
    const whiteMove = history[index + WHITE_PLY_OFFSET];

    if (!whiteMove) {
      continue;
    }

    const blackMove = history[index + BLACK_PLY_OFFSET];
    const moveNumber = index / PLIES_PER_FULL_MOVE + FIRST_FULL_MOVE_NUMBER;
    const whitePly = index + FIRST_PLY_NUMBER;
    const blackPly = blackMove ? index + PLIES_PER_FULL_MOVE : undefined;

    rows.push({
      moveNumber,
      whiteMove,
      blackMove,
      whitePly,
      blackPly
    });
  }

  return rows;
}

function buildHistoryStatus(currentPly: number, latestPly: number): string {
  if (currentPly === latestPly) {
    return HISTORY_STATUS_LATEST;
  }

  if (currentPly === START_PLY_INDEX) {
    return HISTORY_STATUS_START;
  }

  return `${HISTORY_STATUS_VIEWING_PREFIX} ${currentPly} ${HISTORY_STATUS_VIEWING_INFIX} ${latestPly}. ${HISTORY_STATUS_VIEWING_SUFFIX}`;
}

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
