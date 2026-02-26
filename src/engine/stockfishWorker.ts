import { ENGINE_PROTOCOL_VERSION } from './types';
import type { AnalysisSettings, EngineRequest, EngineResponse } from './types';
import { parseUciInfoLine } from './uciParser';

const STOCKFISH_WORKER_GLOB = '/node_modules/stockfish/src/stockfish-*-lite-single-*.js';
// Resolve the hashed Stockfish worker file without hardcoding the build hash.
const stockfishWorkerUrl = resolveStockfishWorkerUrl(
  import.meta.glob<string>(STOCKFISH_WORKER_GLOB, { eager: true, as: 'url' })
);

const LINE_PREFIX_INFO = 'info';
const LINE_PREFIX_BESTMOVE = 'bestmove';
const LINE_READY = 'uciok';

const engineWorker = new Worker(stockfishWorkerUrl, { type: 'classic' });
let activeRequestId: string | null = null;

function resolveStockfishWorkerUrl(candidates: Record<string, string>): string {
  const entries = Object.entries(candidates);
  if (entries.length === 0) {
    throw new Error(
      `Stockfish worker asset not found. Expected one file matching ${STOCKFISH_WORKER_GLOB}.`
    );
  }
  if (entries.length > 1) {
    const matches = entries.map(([path]) => path).sort().join(', ');
    throw new Error(
      `Multiple Stockfish worker assets matched ${STOCKFISH_WORKER_GLOB}. ` +
        `Expected exactly one file. Found: ${matches}.`
    );
  }
  return entries[0][1];
}

function post(response: EngineResponse) {
  self.postMessage(response);
}

function sendEngine(command: string) {
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

engineWorker.onmessage = (event: MessageEvent<string>) => {
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

engineWorker.onerror = () => {
  post({
    type: 'error',
    version: ENGINE_PROTOCOL_VERSION,
    message: 'Stockfish worker failed to start.'
  });
};

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
    engineWorker.terminate();
  }
};
