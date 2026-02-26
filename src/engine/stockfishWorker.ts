/**
 * Stockfish worker bridge: spawns the engine worker and translates UCI output
 * into typed messages for the UI layer.
 */
import { ENGINE_PROTOCOL_VERSION } from './types';
import type { AnalysisSettings, EngineRequest, EngineResponse } from './types';
import { parseUciInfoLine } from './uciParser';
import {
  stockfishEngineAssetsAvailable,
  stockfishEngineAssetsError,
  stockfishEngineScriptUrl,
  stockfishEngineWasmUrl
} from 'virtual:stockfish-assets';

const LINE_PREFIX_INFO = 'info';
const LINE_PREFIX_BESTMOVE = 'bestmove';
const LINE_READY = 'uciok';
const WORKER_HASH_SUFFIX = 'worker';
const WORKER_HASH_SEPARATOR = ',';

// Stockfish expects the wasm path via location.hash when running in a worker.
let engineWorker: Worker | null = null;
let activeRequestId: string | null = null;
let missingAssetsReported = false;

function post(response: EngineResponse) {
  self.postMessage(response);
}

function reportMissingAssets() {
  if (missingAssetsReported) {
    return;
  }
  missingAssetsReported = true;
  post({
    type: 'error',
    version: ENGINE_PROTOCOL_VERSION,
    message: stockfishEngineAssetsError
  });
}

function buildStockfishWorkerUrl(scriptUrl: string, wasmUrl: string): string {
  return `${scriptUrl}#${encodeURIComponent(wasmUrl)}${WORKER_HASH_SEPARATOR}${WORKER_HASH_SUFFIX}`;
}

function attachEngineWorkerHandlers(worker: Worker) {
  worker.onmessage = (event: MessageEvent<string>) => {
    const line = event.data;
    if (typeof line !== 'string') {
      return;
    }

    if (line === LINE_READY) {
      post({ type: 'ready', version: ENGINE_PROTOCOL_VERSION });
      return;
    }

    if (line.startsWith(LINE_PREFIX_INFO)) {
      const parsed = parseUciInfoLine(line);
      if (parsed && activeRequestId) {
        post({
          type: 'analysis',
          version: ENGINE_PROTOCOL_VERSION,
          requestId: activeRequestId,
          line: parsed
        });
      }
      return;
    }

    if (line.startsWith(LINE_PREFIX_BESTMOVE) && activeRequestId) {
      post({
        type: 'done',
        version: ENGINE_PROTOCOL_VERSION,
        requestId: activeRequestId
      });
    }
  };

  worker.onerror = () => {
    post({
      type: 'error',
      version: ENGINE_PROTOCOL_VERSION,
      message: 'Stockfish worker failed to start.'
    });
  };
}

function ensureEngineWorker(): Worker | null {
  if (engineWorker) {
    return engineWorker;
  }

  if (!stockfishEngineAssetsAvailable) {
    reportMissingAssets();
    return null;
  }

  const stockfishWorkerUrl = buildStockfishWorkerUrl(
    stockfishEngineScriptUrl,
    stockfishEngineWasmUrl
  );
  const worker = new Worker(stockfishWorkerUrl, { type: 'classic' });
  attachEngineWorkerHandlers(worker);
  engineWorker = worker;
  return worker;
}

function sendEngine(command: string) {
  if (!engineWorker) {
    return;
  }
  engineWorker.postMessage(command);
}

function buildGoCommand(settings: AnalysisSettings): string {
  if (settings.mode === 'depth') {
    return `go depth ${settings.value}`;
  }
  if (settings.mode === 'time') {
    return `go movetime ${settings.value}`;
  }
  return `go nodes ${settings.value}`;
}

function startAnalysis(requestId: string, fen: string, settings: AnalysisSettings) {
  if (!ensureEngineWorker()) {
    activeRequestId = null;
    return;
  }
  activeRequestId = requestId;
  sendEngine('stop');
  sendEngine('ucinewgame');
  sendEngine(`setoption name MultiPV value ${settings.multiPv}`);
  sendEngine(`position fen ${fen}`);
  sendEngine(buildGoCommand(settings));
}

function stopAnalysis() {
  activeRequestId = null;
  sendEngine('stop');
}

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const message = event.data;
  if (message.version !== ENGINE_PROTOCOL_VERSION) {
    post({
      type: 'error',
      version: ENGINE_PROTOCOL_VERSION,
      message: 'Engine protocol version mismatch.'
    });
    return;
  }

  if (message.type === 'init') {
    if (!ensureEngineWorker()) {
      return;
    }
    sendEngine('uci');
    return;
  }

  if (message.type === 'analyze') {
    startAnalysis(message.requestId, message.fen, message.settings);
    return;
  }

  if (message.type === 'stop') {
    stopAnalysis();
    return;
  }

  if (message.type === 'quit') {
    stopAnalysis();
    if (engineWorker) {
      engineWorker.terminate();
      engineWorker = null;
    }
  }
};
