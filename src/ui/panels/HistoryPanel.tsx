import styles from './HistoryPanel.module.css';

const HALF_MOVES_PER_FULL = 2; // Two plies per full move.
const FIRST_FULL_MOVE = 1; // PGN move numbering starts at 1.
const WHITE_MOVE_OFFSET = 0; // Even indices are White moves.

type HistoryPanelProps = {
  sanMoves: string[];
  currentPly: number;
  onJump: (ply: number) => void;
  onStart: () => void;
  onBack: () => void;
  onForward: () => void;
  onEnd: () => void;
};

function formatMoveLabel(san: string, index: number): string {
  const fullMoveNumber = Math.floor(index / HALF_MOVES_PER_FULL) + FIRST_FULL_MOVE;
  const isWhiteMove = index % HALF_MOVES_PER_FULL === WHITE_MOVE_OFFSET;
  const prefix = isWhiteMove ? `${fullMoveNumber}.` : `${fullMoveNumber}...`;
  return `${prefix} ${san}`;
}

function HistoryPanel({
  sanMoves,
  currentPly,
  onJump,
  onStart,
  onBack,
  onForward,
  onEnd
}: HistoryPanelProps) {
  const hasMoves = sanMoves.length > 0;
  const atStart = currentPly === 0;
  const atEnd = currentPly === sanMoves.length;

  return (
    <div className={styles.panel}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onStart}
          disabled={!hasMoves || atStart}
        >
          |&lt;
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onBack}
          disabled={!hasMoves || atStart}
        >
          &lt;
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onForward}
          disabled={!hasMoves || atEnd}
        >
          &gt;
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onEnd}
          disabled={!hasMoves || atEnd}
        >
          &gt;|
        </button>
      </div>
      <div className={styles.moveList} data-testid="move-list">
        {sanMoves.map((san, index) => {
          const isCurrent = currentPly - 1 === index;
          return (
            <button
              key={`${san}-${index}`}
              type="button"
              className={
                isCurrent
                  ? `${styles.moveButton} ${styles.currentMove}`
                  : styles.moveButton
              }
              onClick={() => onJump(index + 1)}
            >
              {formatMoveLabel(san, index)}
            </button>
          );
        })}
        {!hasMoves && <span>No moves yet.</span>}
      </div>
    </div>
  );
}

export default HistoryPanel;
