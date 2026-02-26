import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { analysisReducer, createInitialAnalysisState } from './analysisState';
import {
  DEFAULT_MULTIPV,
  ENGINE_PROTOCOL_VERSION
} from './types';
import type { AnalysisSettings, EngineRequest, EngineResponse } from './types';

const REQUEST_PREFIX = 'analysis';
const REQUEST_COUNTER_START = 0;

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

  const sendMessage = useCallback((message: EngineRequest) => {
    workerRef.current?.postMessage(message);
  }, []);

  const initializeWorker = useCallback(() => {
    if (workerRef.current) {
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
        setIsReady(true);
        return;
      }
      if (response.type === 'analysis') {
        dispatch({ type: 'line', requestId: response.requestId, line: response.line });
        return;
      }
      if (response.type === 'done') {
        dispatch({ type: 'done', requestId: response.requestId });
        return;
      }
      if (response.type === 'error') {
        dispatch({
          type: 'error',
          requestId: response.requestId,
          message: response.message
        });
        sendMessage({ type: 'stop', version: ENGINE_PROTOCOL_VERSION });
      }
    };

    worker.onerror = () => {
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
  }, [sendMessage]);

  useEffect(() => {
    initializeWorker();
    return () => {
      terminateWorker();
    };
  }, [initializeWorker, terminateWorker]);

  useEffect(() => {
    if (!enabled) {
      dispatch({ type: 'reset' });
      sendMessage({ type: 'stop', version: ENGINE_PROTOCOL_VERSION });
      return;
    }

    if (!isReady) {
      return;
    }

    requestCounterRef.current += 1;
    const requestId = buildRequestId(requestCounterRef.current);
    dispatch({ type: 'start', requestId });

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
    status: state.status,
    error: state.error,
    restart
  };
}

export default useEngineAnalysis;
