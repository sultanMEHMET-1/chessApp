import { useCallback, useMemo, useState } from 'react';
import type { Square } from 'chess.js';
import { STARTING_FEN } from '../chess/constants';
import {
  applyMoveToTimeline,
  createTimeline,
  exportTimelinePgn,
  getCurrentFen,
  getCurrentStatus,
  getLastMove,
  importPgnToTimeline,
  replaceTimelinePosition,
  setTimelinePly
} from '../chess/gameState';
import {
  buildFen,
  createEditorPositionFromFen,
  validateEditorPosition
} from '../chess/fen';
import { getBoardPieces, getLegalMovesForSquare, normalizePromotionSelection } from '../chess/rules';
import type { BoardPiece, LegalMove } from '../chess/types';
import { DEFAULT_MULTIPV } from '../engine/types';
import type { AnalysisMode } from '../engine/types';
import useEngineAnalysis from '../engine/useEngineAnalysis';
import Board from './board/Board';
import HistoryPanel from './panels/HistoryPanel';
import PgnPanel from './panels/PgnPanel';
import EditorPanel from './panels/EditorPanel';
import AnalysisPanel from './panels/AnalysisPanel';
import styles from './ChessApp.module.css';

const DEFAULT_STARTING_FEN = STARTING_FEN;

const MIN_PLY = 0; // Start position index.

const DEFAULT_PGN = '';
const DEFAULT_ANALYSIS_MODE: AnalysisMode = 'depth';
const DEFAULT_ANALYSIS_VALUE = 8; // Fast default depth for responsive analysis.
const MIN_ANALYSIS_VALUE = 1; // Analysis settings must be positive.

type ChessAppProps = {
  initialFen?: string;
};

function ChessApp({ initialFen = DEFAULT_STARTING_FEN }: ChessAppProps) {
  const [timeline, setTimeline] = useState(() => createTimeline(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [pgnText, setPgnText] = useState(DEFAULT_PGN);
  const [pgnError, setPgnError] = useState<string | undefined>();
  const [editorActive, setEditorActive] = useState(false);
  const [editorPosition, setEditorPosition] = useState(() =>
    createEditorPositionFromFen(initialFen)
  );
  const [editorError, setEditorError] = useState<string | undefined>();
  const [selectedEditorPiece, setSelectedEditorPiece] = useState<BoardPiece | null>(null);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(DEFAULT_ANALYSIS_MODE);
  const [analysisValue, setAnalysisValue] = useState(DEFAULT_ANALYSIS_VALUE);

  const currentFen = useMemo(() => getCurrentFen(timeline), [timeline]);
  const status = useMemo(() => getCurrentStatus(timeline), [timeline]);
  const pieces = useMemo(() => getBoardPieces(currentFen), [currentFen]);
  const lastMove = useMemo(() => getLastMove(timeline), [timeline]);

  const boardPieces = editorActive ? editorPosition.pieces : pieces;

  const legalDestinations = useMemo(
    () => new Set(legalMoves.map((move) => move.to)),
    [legalMoves]
  );

  const analysisSettings = useMemo(
    () => ({
      mode: analysisMode,
      value: Math.max(MIN_ANALYSIS_VALUE, analysisValue),
      multiPv: DEFAULT_MULTIPV
    }),
    [analysisMode, analysisValue]
  );

  const analysis = useEngineAnalysis({
    fen: currentFen,
    enabled: analysisEnabled,
    settings: analysisSettings
  });

  const editorValidation = useMemo(
    () => validateEditorPosition(editorPosition),
    [editorPosition]
  );
  const editorWarning =
    editorActive && editorValidation.ok ? editorValidation.warning : undefined;

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const handleTimelineUpdate = useCallback((nextTimeline: typeof timeline) => {
    setTimeline(nextTimeline);
    clearSelection();
  }, [clearSelection]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (editorActive) {
        setEditorPosition((previous) => ({
          ...previous,
          pieces: {
            ...previous.pieces,
            [square]: selectedEditorPiece
          }
        }));
        return;
      }

      if (selectedSquare && legalDestinations.has(square)) {
        const moveSelection = normalizePromotionSelection(legalMoves, square);
        if (!moveSelection) {
          return;
        }
        const updated = applyMoveToTimeline(timeline, moveSelection);
        if (updated) {
          handleTimelineUpdate(updated);
        }
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
      editorActive,
      handleTimelineUpdate,
      legalDestinations,
      legalMoves,
      pieces,
      selectedEditorPiece,
      selectedSquare,
      status.turn,
      timeline
    ]
  );

  const handleJumpToPly = useCallback((ply: number) => {
    setTimeline((previous) => setTimelinePly(previous, ply));
    clearSelection();
  }, [clearSelection]);

  const handleStart = useCallback(() => handleJumpToPly(MIN_PLY), [handleJumpToPly]);
  const handleBack = useCallback(() => {
    setTimeline((previous) => setTimelinePly(previous, previous.currentPly - 1));
    clearSelection();
  }, [clearSelection]);
  const handleForward = useCallback(() => {
    setTimeline((previous) => setTimelinePly(previous, previous.currentPly + 1));
    clearSelection();
  }, [clearSelection]);
  const handleEnd = useCallback(() => {
    setTimeline((previous) => setTimelinePly(previous, previous.moves.length));
    clearSelection();
  }, [clearSelection]);

  const handleImportPgn = useCallback(() => {
    const { timeline: imported, error } = importPgnToTimeline(pgnText, timeline.initialFen);
    if (error) {
      setPgnError(error);
      return;
    }
    setPgnError(undefined);
    handleTimelineUpdate(imported);
  }, [handleTimelineUpdate, pgnText, timeline.initialFen]);

  const handleExportPgn = useCallback(() => {
    setPgnText(exportTimelinePgn(timeline));
    setPgnError(undefined);
  }, [timeline]);

  const handleToggleEditor = useCallback(
    (active: boolean) => {
      setEditorActive(active);
      if (active) {
        setEditorPosition(createEditorPositionFromFen(currentFen));
        setEditorError(undefined);
        setSelectedEditorPiece(null);
        clearSelection();
      }
    },
    [clearSelection, currentFen]
  );

  const handleUpdateEditor = useCallback((next: typeof editorPosition) => {
    setEditorPosition(next);
    setEditorError(undefined);
  }, []);

  const handleApplyEditor = useCallback(() => {
    const validation = validateEditorPosition(editorPosition);
    if (!validation.ok) {
      setEditorError(validation.error ?? 'Position is invalid.');
      return;
    }
    const fen = buildFen(editorPosition);
    setEditorError(undefined);
    handleTimelineUpdate(replaceTimelinePosition(timeline, fen));
    setEditorActive(false);
  }, [editorPosition, handleTimelineUpdate, timeline]);

  const handleAnalysisValueChange = useCallback((value: number) => {
    setAnalysisValue(Math.max(MIN_ANALYSIS_VALUE, value));
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chess App</h1>
        <p className={styles.subtitle}>Click to select, highlight legal moves, and play.</p>
      </header>
      {analysis.status === 'error' && analysis.error && (
        <div className={styles.banner} role="alert">
          <span>{analysis.error}</span>
          <button type="button" className={styles.bannerButton} onClick={analysis.restart}>
            Restart Engine
          </button>
        </div>
      )}
      <main className={styles.layout}>
        <section className={styles.boardSection}>
          <Board
            pieces={boardPieces}
            selectedSquare={editorActive ? null : selectedSquare}
            legalDestinations={editorActive ? new Set() : legalDestinations}
            lastMove={editorActive ? undefined : lastMove}
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
              {editorActive && (
                <span className={styles.statusBadge}>Editor mode active</span>
              )}
            </div>
            <div className={styles.fenValue} data-testid="fen">
              {currentFen}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Engine Analysis</h2>
            <AnalysisPanel
              enabled={analysisEnabled}
              mode={analysisMode}
              value={analysisValue}
              lines={analysis.lines}
              status={analysis.status}
              error={analysis.error}
              onToggle={setAnalysisEnabled}
              onModeChange={setAnalysisMode}
              onValueChange={handleAnalysisValueChange}
              onRestart={analysis.restart}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Move History</h2>
            <HistoryPanel
              sanMoves={timeline.san}
              currentPly={timeline.currentPly}
              onJump={handleJumpToPly}
              onStart={handleStart}
              onBack={handleBack}
              onForward={handleForward}
              onEnd={handleEnd}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>PGN Import / Export</h2>
            <PgnPanel
              pgn={pgnText}
              error={pgnError}
              onChange={setPgnText}
              onImport={handleImportPgn}
              onExport={handleExportPgn}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Position Editor</h2>
            <EditorPanel
              editor={editorPosition}
              selectedPiece={selectedEditorPiece}
              isActive={editorActive}
              error={editorError}
              warning={editorWarning}
              onToggleActive={handleToggleEditor}
              onSelectPiece={setSelectedEditorPiece}
              onUpdateEditor={handleUpdateEditor}
              onApply={handleApplyEditor}
            />
          </section>
        </aside>
      </main>
    </div>
  );
}

export default ChessApp;
