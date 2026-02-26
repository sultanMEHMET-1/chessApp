/**
 * Typed and versioned engine protocol definitions for Stockfish worker messaging.
 */

const ENGINE_PROTOCOL_VERSION = 1; // Bump when message contracts change.
const DEFAULT_MULTIPV = 3; // Requirement: surface top 3 lines.

type AnalysisMode = 'depth' | 'time' | 'nodes';

type AnalysisSettings = {
  mode: AnalysisMode;
  value: number;
  multiPv: number;
};

type Score =
  | { type: 'cp'; value: number }
  | { type: 'mate'; value: number };

type AnalysisLine = {
  multipv: number;
  depth: number;
  score: Score;
  pv: string[];
  nodes?: number;
  time?: number;
};

type EngineRequest =
  | { version: number; type: 'init' }
  | {
      version: number;
      type: 'analyze';
      requestId: string;
      fen: string;
      settings: AnalysisSettings;
    }
  | { version: number; type: 'stop'; requestId?: string }
  | { version: number; type: 'quit' };

type EngineResponse =
  | { version: number; type: 'ready' }
  | {
      version: number;
      type: 'analysis';
      requestId: string;
      line: AnalysisLine;
    }
  | { version: number; type: 'done'; requestId: string }
  | { version: number; type: 'error'; requestId?: string; message: string };

export {
  DEFAULT_MULTIPV,
  ENGINE_PROTOCOL_VERSION
};

export type {
  AnalysisLine,
  AnalysisMode,
  AnalysisSettings,
  EngineRequest,
  EngineResponse,
  Score
};
