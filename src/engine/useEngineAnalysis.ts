import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { analysisReducer, createInitialAnalysisState } from './analysisState';
import { buildAnalysisLine } from './analysisLine';
import {
  DEFAULT_MULTIPV,
  ENGINE_PROTOCOL_VERSION
} from './types';
import type { AnalysisSettings, EngineRequest, EngineResponse } from './types';

const REQUEST_PREFIX = 'analysis';
const REQUEST_COUNTER_START = 0;
const WORKER_UNAVAILABLE_MESSAGE = 'Web Workers are not available in this environment.';
const ENGINE_START_TIMEOUT_MS = 8000; // Guard against stalled engine startup.
const ENGINE_START_TIMEOUT_MESSAGE =
  'Stockfish did not become ready. Please restart the engine.';

function buildRequestId(counter: number): string {
  return `${REQUEST_PREFIX}-${counter}`;
}

type UseEngineAnalysisArgs = {
  fen: string;
  enabled: boolean;
  settings: AnalysisSettings;
};

function useEngineAnalysis({ fen, enabled, settings }: UseEngineAnalysisArgs) {
  const [state, dispatch] = useReducer(analysisReducer, undefined, createInitialAnalysisState);
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestCounterRef = useRef(REQUEST_COUNTER_START);
  const activeRequestRef = useRef<{ requestId: string; fen: string } | null>(null);
  const startupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback((message: EngineRequest) => {
    workerRef.current?.postMessage(message);
  }, []);

  const clearStartupTimeout = useCallback(() => {
    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }
  }, []);

  const armStartupTimeout = useCallback(() => {
    clearStartupTimeout();
    startupTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'error', message: ENGINE_START_TIMEOUT_MESSAGE });
    }, ENGINE_START_TIMEOUT_MS);
  }, [clearStartupTimeout]);

  const initializeWorker = useCallback(() => {
    if (workerRef.current) {
      return;
    }

    if (typeof Worker === 'undefined') {
      dispatch({ type: 'error', message: WORKER_UNAVAILABLE_MESSAGE });
      return;
    }

    const worker = new Worker(new URL('./stockfishWorker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (event) => {
      const response = event.data as EngineResponse;
      if (response.version !== ENGINE_PROTOCOL_VERSION) {
        return;
      }
      if (response.type === 'ready') {
        clearStartupTimeout();
        setIsReady(true);
        return;
      }
      if (response.type === 'analysis') {
        if (!activeRequestRef.current || response.requestId !== activeRequestRef.current.requestId) {
          return;
        }
        const formatted = buildAnalysisLine(activeRequestRef.current.fen, response.line);
        dispatch({ type: 'line', requestId: response.requestId, line: formatted });
        return;
      }
      if (response.type === 'done') {
        dispatch({ type: 'done', requestId: response.requestId });
        return;
      }
      if (response.type === 'error') {
        clearStartupTimeout();
        dispatch({
          type: 'error',
          requestId: response.requestId,
          message: response.message
        });
        sendMessage({ type: 'stop', version: ENGINE_PROTOCOL_VERSION });
      }
    };

    worker.onerror = () => {
      clearStartupTimeout();
      dispatch({ type: 'error', message: 'Engine worker failed to start.' });
    };

    workerRef.current = worker;
    sendMessage({ type: 'init', version: ENGINE_PROTOCOL_VERSION });
  }, [sendMessage]);

  const terminateWorker = useCallback(() => {
    if (!workerRef.current) {
      return;
    }
    sendMessage({ type: 'quit', version: ENGINE_PROTOCOL_VERSION });
    workerRef.current.terminate();
    workerRef.current = null;
    setIsReady(false);
    activeRequestRef.current = null;
    clearStartupTimeout();
  }, [sendMessage]);

  useEffect(() => {
    initializeWorker();
    return () => {
      terminateWorker();
    };
  }, [initializeWorker, terminateWorker]);

  useEffect(() => {
    if (!enabled || isReady || state.status === 'error') {
      clearStartupTimeout();
      return;
    }
    armStartupTimeout();
    return () => {
      clearStartupTimeout();
    };
  }, [armStartupTimeout, clearStartupTimeout, enabled, isReady, state.status]);

  useEffect(() => {
    if (!enabled) {
      dispatch({ type: 'reset' });
      sendMessage({ type: 'stop', version: ENGINE_PROTOCOL_VERSION });
      activeRequestRef.current = null;
      return;
    }

    if (!isReady) {
      return;
    }

    requestCounterRef.current += 1;
    const requestId = buildRequestId(requestCounterRef.current);
    dispatch({ type: 'start', requestId });
    activeRequestRef.current = { requestId, fen };

    sendMessage({
      type: 'analyze',
      version: ENGINE_PROTOCOL_VERSION,
      requestId,
      fen,
      settings: {
        ...settings,
        multiPv: settings.multiPv || DEFAULT_MULTIPV
      }
    });
  }, [enabled, fen, isReady, sendMessage, settings]);

  const restart = useCallback(() => {
    terminateWorker();
    initializeWorker();
  }, [initializeWorker, terminateWorker]);

  return {
    lines: state.lines,
    requestId: state.requestId,
    status: state.status,
    error: state.error,
    isReady,
    restart
  };
}

export default useEngineAnalysis;
