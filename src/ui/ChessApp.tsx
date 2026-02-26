import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Square } from 'chess.js';
import { STARTING_FEN } from '../chess/constants';
import {
  applyMoveToTimeline,
  createTimeline,
  getCurrentFen,
  getCurrentStatus,
  getLastMove
} from '../chess/gameState';
import { getBoardPieces, getLegalMovesForSquare, normalizePromotionSelection } from '../chess/rules';
import type { LegalMove } from '../chess/types';
import Board from './board/Board';
import styles from './ChessApp.module.css';

const DEFAULT_STARTING_FEN = STARTING_FEN;

type ChessAppProps = {
  initialFen?: string;
};

function ChessApp({ initialFen = DEFAULT_STARTING_FEN }: ChessAppProps) {
  const [timeline, setTimeline] = useState(() => createTimeline(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);

  const currentFen = useMemo(() => getCurrentFen(timeline), [timeline]);
  const status = useMemo(() => getCurrentStatus(timeline), [timeline]);
  const pieces = useMemo(() => getBoardPieces(currentFen), [currentFen]);
  const lastMove = useMemo(() => getLastMove(timeline), [timeline]);

  const legalDestinations = useMemo(
    () => new Set(legalMoves.map((move) => move.to)),
    [legalMoves]
  );

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [currentFen, clearSelection]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (selectedSquare && legalDestinations.has(square)) {
        const moveSelection = normalizePromotionSelection(legalMoves, square);
        if (!moveSelection) {
          return;
        }
        const updated = applyMoveToTimeline(timeline, moveSelection);
        if (updated) {
          setTimeline(updated);
        }
        clearSelection();
        return;
      }

      const piece = pieces[square];
      if (piece && piece.color === status.turn) {
        const moves = getLegalMovesForSquare(currentFen, square);
        setSelectedSquare(square);
        setLegalMoves(moves);
        return;
      }

      clearSelection();
    },
    [
      clearSelection,
      currentFen,
      legalDestinations,
      legalMoves,
      pieces,
      selectedSquare,
      status.turn,
      timeline
    ]
  );

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chess App</h1>
        <p className={styles.subtitle}>Click to select, highlight legal moves, and play.</p>
      </header>
      <main className={styles.layout}>
        <section className={styles.boardSection}>
          <Board
            pieces={pieces}
            selectedSquare={selectedSquare}
            legalDestinations={legalDestinations}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
          />
        </section>
        <aside className={styles.panelColumn}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Position Status</h2>
            <div className={styles.statusRow}>
              <span className={styles.statusBadge} data-testid="side-to-move">
                {status.turn === 'w' ? 'White' : 'Black'} to move
              </span>
              {status.isCheck && (
                <span className={styles.statusBadge} data-testid="check-indicator">
                  Check
                </span>
              )}
            </div>
            <div className={styles.fenValue} data-testid="fen">
              {currentFen}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default ChessApp;
