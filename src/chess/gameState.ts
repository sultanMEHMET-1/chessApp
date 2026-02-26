/**
 * Timeline helpers for managing chess game state and navigation.
 */
import { STARTING_FEN } from './constants';
import {
  applyMoveToHistory,
  exportPgn,
  getFenFromHistory,
  getGameStatusFromHistory,
  importPgn
} from './rules';
import type { GameStatus, LastMove, MoveSelection } from './types';

const MIN_PLY = 0; // Start position index.

type GameTimeline = {
  initialFen: string;
  moves: MoveSelection[];
  san: string[];
  currentPly: number;
};

function createTimeline(initialFen: string = STARTING_FEN): GameTimeline {
  return {
    initialFen,
    moves: [],
    san: [],
    currentPly: MIN_PLY
  };
}

function getCurrentMoves(timeline: GameTimeline): MoveSelection[] {
  return timeline.moves.slice(MIN_PLY, timeline.currentPly);
}

function getCurrentSan(timeline: GameTimeline): string[] {
  return timeline.san.slice(MIN_PLY, timeline.currentPly);
}

function getCurrentFen(timeline: GameTimeline): string {
  return getFenFromHistory(timeline.initialFen, getCurrentMoves(timeline));
}

function getCurrentStatus(timeline: GameTimeline): GameStatus {
  return getGameStatusFromHistory(timeline.initialFen, getCurrentMoves(timeline));
}

function getLastMove(timeline: GameTimeline): LastMove | undefined {
  if (timeline.currentPly === MIN_PLY) {
    return undefined;
  }
  const index = timeline.currentPly - 1;
  return {
    from: timeline.moves[index].from,
    to: timeline.moves[index].to,
    san: timeline.san[index] ?? '',
    promotion: timeline.moves[index].promotion
  };
}

function applyMoveToTimeline(timeline: GameTimeline, move: MoveSelection): GameTimeline | null {
  const currentMoves = getCurrentMoves(timeline);
  const snapshot = applyMoveToHistory(timeline.initialFen, currentMoves, move);
  if (!snapshot) {
    return null;
  }

  return {
    initialFen: timeline.initialFen,
    moves: snapshot.moves,
    san: snapshot.san,
    currentPly: snapshot.moves.length
  };
}

function setTimelinePly(timeline: GameTimeline, ply: number): GameTimeline {
  const clamped = Math.max(MIN_PLY, Math.min(ply, timeline.moves.length));
  return {
    ...timeline,
    currentPly: clamped
  };
}

function replaceTimelinePosition(timeline: GameTimeline, fen: string): GameTimeline {
  return {
    ...timeline,
    initialFen: fen,
    moves: [],
    san: [],
    currentPly: MIN_PLY
  };
}

function importPgnToTimeline(pgn: string, initialFen: string = STARTING_FEN): {
  timeline: GameTimeline;
  error?: string;
} {
  const result = importPgn(pgn, initialFen);
  return {
    timeline: {
      initialFen,
      moves: result.moves,
      san: result.san,
      currentPly: result.moves.length
    },
    error: result.error
  };
}

function exportTimelinePgn(timeline: GameTimeline): string {
  const currentMoves = getCurrentMoves(timeline);
  return exportPgn(timeline.initialFen, currentMoves);
}

export type { GameTimeline };
export {
  applyMoveToTimeline,
  createTimeline,
  exportTimelinePgn,
  getCurrentFen,
  getCurrentMoves,
  getCurrentSan,
  getCurrentStatus,
  getLastMove,
  importPgnToTimeline,
  replaceTimelinePosition,
  setTimelinePly
};
