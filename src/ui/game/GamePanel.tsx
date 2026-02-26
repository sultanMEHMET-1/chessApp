// Orchestrates the board, move list navigation, and PGN import/export controls.
import { useMemo, useState } from "react";
import { ChessState, type MoveRecord } from "../../chess/chessState";
import { exportPgnFromMoves } from "../../chess/pgn";
import { Board } from "../board/Board";
import styles from "./GamePanel.module.css";

const INITIAL_PLY_INDEX = 0;
const MOVES_PER_TURN = 2;
const FIRST_TURN_NUMBER = 1;
const WHITE_PLY_OFFSET = 1;
const BLACK_PLY_OFFSET = 2;
const PGN_TEXTAREA_ROWS = 6;
const EMPTY_MOVE_LABEL = "--";
const PGN_PLACEHOLDER = "1. e4 e5 2. Nf3 Nc6";

type MoveRow = {
  turnNumber: number;
  whiteMove?: MoveRecord;
  blackMove?: MoveRecord;
  whitePly: number;
  blackPly: number;
};

export function GamePanel() {
  const [chessState] = useState(() => new ChessState());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [currentPly, setCurrentPly] = useState(INITIAL_PLY_INDEX);
  const [startFen, setStartFen] = useState(() => chessState.getFen());
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [exportText, setExportText] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [positionVersion, setPositionVersion] = useState(0);

  const lastMove =
    currentPly > INITIAL_PLY_INDEX
      ? moveHistory[currentPly - WHITE_PLY_OFFSET]
      : null;
  const atStart = currentPly === INITIAL_PLY_INDEX;
  const atEnd = currentPly === moveHistory.length;

  const moveRows = useMemo<MoveRow[]>(() => {
    const rows: MoveRow[] = [];

    for (let index = 0; index < moveHistory.length; index += MOVES_PER_TURN) {
      const turnNumber = index / MOVES_PER_TURN + FIRST_TURN_NUMBER;

      rows.push({
        turnNumber,
        whiteMove: moveHistory[index],
        blackMove: moveHistory[index + WHITE_PLY_OFFSET],
        whitePly: index + WHITE_PLY_OFFSET,
        blackPly: index + BLACK_PLY_OFFSET
      });
    }

    return rows;
  }, [moveHistory]);

  const resolveFenForPly = (ply: number): string => {
    if (ply === INITIAL_PLY_INDEX) {
      return startFen;
    }

    const historyIndex = ply - WHITE_PLY_OFFSET;
    return moveHistory[historyIndex]?.after ?? startFen;
  };

  const jumpToPly = (nextPly: number) => {
    const boundedPly = Math.min(
      Math.max(nextPly, INITIAL_PLY_INDEX),
      moveHistory.length
    );
    const targetFen = resolveFenForPly(boundedPly);
    const result = chessState.loadFen(targetFen);

    if (!result.ok) {
      setGameError(result.error);
      return;
    }

    setGameError(null);
    setCurrentPly(boundedPly);
    setPositionVersion((version) => version + 1);
  };

  const handleBoardMove = (move: MoveRecord) => {
    const trimmedHistory = moveHistory.slice(0, currentPly);
    const nextHistory = [...trimmedHistory, move];

    setMoveHistory(nextHistory);
    setCurrentPly(nextHistory.length);
    setExportText("");
    setExportError(null);
    setGameError(null);
  };

  const handleImport = () => {
    const result = chessState.loadPgn(importText);

    if (!result.ok) {
      setImportError(result.error);
      return;
    }

    setImportError(null);
    setExportText("");
    setExportError(null);
    setGameError(null);
    setMoveHistory(result.history);
    setCurrentPly(result.history.length);
    setStartFen(result.startFen);
    setPositionVersion((version) => version + 1);
  };

  const handleExport = () => {
    const result = exportPgnFromMoves(startFen, moveHistory);

    if (!result.ok) {
      setExportError(result.error);
      setExportText("");
      return;
    }

    setExportError(null);
    setExportText(result.pgn);
  };

  const handleImportChange = (value: string) => {
    setImportText(value);
    setImportError(null);
  };

  const handleClearImport = () => {
    setImportText("");
    setImportError(null);
  };

  const plyIndicator = `${currentPly} / ${moveHistory.length}`;

  return (
    <div className={styles.panel}>
      <Board
        state={chessState}
        positionVersion={positionVersion}
        lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
        onMoveApplied={handleBoardMove}
      />

      <div className={styles.controls}>
        <section className={styles.section} aria-label="Move list">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Move List</h3>
            <span className={styles.sectionMeta}>Ply {plyIndicator}</span>
          </div>
          <div className={styles.navigation}>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => jumpToPly(INITIAL_PLY_INDEX)}
              disabled={atStart}
            >
              Start
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => jumpToPly(currentPly - WHITE_PLY_OFFSET)}
              disabled={atStart}
            >
              Back
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => jumpToPly(currentPly + WHITE_PLY_OFFSET)}
              disabled={atEnd}
            >
              Forward
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => jumpToPly(moveHistory.length)}
              disabled={atEnd}
            >
              End
            </button>
          </div>

          {moveRows.length > 0 ? (
            <ol className={styles.moveList}>
              {moveRows.map((row) => (
                <li key={row.turnNumber} className={styles.moveRow}>
                  <span className={styles.moveNumber}>{row.turnNumber}.</span>
                  <button
                    type="button"
                    className={styles.moveButton}
                    onClick={() => jumpToPly(row.whitePly)}
                    data-active={row.whitePly === currentPly ? "true" : undefined}
                    aria-current={
                      row.whitePly === currentPly ? "step" : undefined
                    }
                    aria-label={
                      row.whiteMove
                        ? `Move ${row.turnNumber} White ${row.whiteMove.san}`
                        : `Move ${row.turnNumber} White unavailable`
                    }
                    disabled={!row.whiteMove}
                  >
                    {row.whiteMove ? row.whiteMove.san : EMPTY_MOVE_LABEL}
                  </button>
                  <button
                    type="button"
                    className={styles.moveButton}
                    onClick={() => jumpToPly(row.blackPly)}
                    data-active={row.blackPly === currentPly ? "true" : undefined}
                    aria-current={
                      row.blackPly === currentPly ? "step" : undefined
                    }
                    aria-label={
                      row.blackMove
                        ? `Move ${row.turnNumber} Black ${row.blackMove.san}`
                        : `Move ${row.turnNumber} Black unavailable`
                    }
                    disabled={!row.blackMove}
                  >
                    {row.blackMove ? row.blackMove.san : EMPTY_MOVE_LABEL}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.emptyState}>No moves yet.</p>
          )}
        </section>

        <section className={styles.section} aria-label="PGN tools">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>PGN</h3>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pgn-import">
              PGN import
            </label>
            <textarea
              id="pgn-import"
              className={styles.textarea}
              value={importText}
              onChange={(event) => handleImportChange(event.target.value)}
              rows={PGN_TEXTAREA_ROWS}
              placeholder={PGN_PLACEHOLDER}
              data-testid="pgn-input"
            />
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleImport}
              >
                Import PGN
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={handleClearImport}
              >
                Clear
              </button>
            </div>
            {importError ? (
              <p className={styles.errorBanner} role="alert">
                {importError}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <div className={styles.exportHeader}>
              <label className={styles.fieldLabel} htmlFor="pgn-export">
                PGN export
              </label>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleExport}
              >
                Export PGN
              </button>
            </div>
            <textarea
              id="pgn-export"
              className={styles.textarea}
              value={exportText}
              readOnly
              rows={PGN_TEXTAREA_ROWS}
              data-testid="pgn-output"
            />
            {exportError ? (
              <p className={styles.errorBanner} role="alert">
                {exportError}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {gameError ? (
        <p className={styles.errorBanner} role="alert">
          {gameError}
        </p>
      ) : null}
    </div>
  );
}
