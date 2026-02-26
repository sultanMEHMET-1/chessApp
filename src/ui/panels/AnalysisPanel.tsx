import type { AnalysisLine, AnalysisMode } from '../../engine/types';
import styles from './AnalysisPanel.module.css';

const CENTIPAWN_SCALE = 100; // Convert centipawns to pawn units.
const PAWN_DECIMALS = 2; // Show two decimals for evaluation.
const MIN_ANALYSIS_VALUE = 1; // Analysis settings must be positive.
const REQUEST_ID_IDLE = 'idle'; // Placeholder when analysis is not running.

const ANALYSIS_MODES: Array<{ value: AnalysisMode; label: string }> = [
  { value: 'depth', label: 'Depth' },
  { value: 'time', label: 'Time (ms)' },
  { value: 'nodes', label: 'Nodes' }
];

type AnalysisPanelProps = {
  enabled: boolean;
  mode: AnalysisMode;
  value: number;
  lines: AnalysisLine[];
  status: 'idle' | 'running' | 'error';
  error?: string;
  requestId: string | null;
  onToggle: (enabled: boolean) => void;
  onModeChange: (mode: AnalysisMode) => void;
  onValueChange: (value: number) => void;
  onRestart: () => void;
};

function formatScore(line: AnalysisLine): string {
  if (line.score.type === 'mate') {
    return `#${line.score.value}`;
  }
  const pawns = line.score.value / CENTIPAWN_SCALE;
  const sign = pawns >= 0 ? '+' : '';
  return `${sign}${pawns.toFixed(PAWN_DECIMALS)}`;
}

function AnalysisPanel({
  enabled,
  mode,
  value,
  lines,
  status,
  error,
  requestId,
  onToggle,
  onModeChange,
  onValueChange,
  onRestart
}: AnalysisPanelProps) {
  return (
    <div
      className={styles.panel}
      data-testid="analysis-panel"
      data-request-id={requestId ?? REQUEST_ID_IDLE}
    >
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={() => onToggle(!enabled)}
          data-testid="analysis-toggle"
        >
          {enabled ? 'Stop Analysis' : 'Start Analysis'}
        </button>
        <select
          className={styles.select}
          value={mode}
          onChange={(event) => onModeChange(event.target.value as AnalysisMode)}
          data-testid="analysis-mode"
        >
          {ANALYSIS_MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className={styles.input}
          type="number"
          min={MIN_ANALYSIS_VALUE}
          value={value}
          onChange={(event) => onValueChange(Number(event.target.value))}
          data-testid="analysis-value"
        />
        {status === 'error' && (
          <button type="button" className={styles.controlButton} onClick={onRestart}>
            Restart Engine
          </button>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.lineList}>
        {lines.map((line) => (
          <div
            key={line.multipv}
            className={styles.lineItem}
            data-testid={`analysis-line-${line.multipv}`}
          >
            <div className={styles.lineHeader}>
              <span>#{line.multipv} {formatScore(line)}</span>
              <span>Depth {line.depth}</span>
            </div>
            <div className={styles.bestMove}>
              Best: {line.bestMoveSan || line.bestMoveUci}
              {line.bestMoveUci && line.bestMoveSan && line.bestMoveSan !== line.bestMoveUci && (
                <span className={styles.bestMoveUci}>({line.bestMoveUci})</span>
              )}
            </div>
            <div className={styles.linePv}>
              {(line.pvSan.length ? line.pvSan : line.pvUci).join(' ')}
            </div>
          </div>
        ))}
        {lines.length === 0 && <span>No analysis yet.</span>}
      </div>
    </div>
  );
}

export default AnalysisPanel;
