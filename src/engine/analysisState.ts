/**
 * Reducer for analysis UI state with stale-response protection.
 */
import type { AnalysisLine } from './types';

const MAX_LINES = 3; // Matches default MultiPV output.

type AnalysisStatus = 'idle' | 'running' | 'error';

type AnalysisState = {
  requestId: string | null;
  lines: AnalysisLine[];
  status: AnalysisStatus;
  error?: string;
};

type AnalysisAction =
  | { type: 'start'; requestId: string }
  | { type: 'line'; requestId: string; line: AnalysisLine }
  | { type: 'done'; requestId: string }
  | { type: 'error'; requestId?: string; message: string }
  | { type: 'reset' };

function createInitialAnalysisState(): AnalysisState {
  return {
    requestId: null,
    lines: [],
    status: 'idle'
  };
}

function upsertLine(lines: AnalysisLine[], line: AnalysisLine): AnalysisLine[] {
  const index = Math.max(line.multipv - 1, 0);
  const next = [...lines];
  next[index] = line;
  return next.slice(0, MAX_LINES);
}

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'start':
      return {
        requestId: action.requestId,
        lines: [],
        status: 'running'
      };
    case 'line':
      if (state.requestId !== action.requestId) {
        return state;
      }
      return {
        ...state,
        lines: upsertLine(state.lines, action.line)
      };
    case 'done':
      if (state.requestId !== action.requestId) {
        return state;
      }
      return {
        ...state,
        status: 'idle'
      };
    case 'error':
      if (action.requestId && state.requestId !== action.requestId) {
        return state;
      }
      return {
        ...state,
        status: 'error',
        error: action.message
      };
    case 'reset':
      return createInitialAnalysisState();
    default:
      return state;
  }
}

export type { AnalysisAction, AnalysisState, AnalysisStatus };
export { analysisReducer, createInitialAnalysisState };
