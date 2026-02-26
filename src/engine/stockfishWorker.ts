import stockfish from 'stockfish';
import { ENGINE_PROTOCOL_VERSION } from './types';
import type { AnalysisSettings, EngineRequest, EngineResponse } from './types';
import { parseUciInfoLine } from './uciParser';

const engine = stockfish();
let activeRequestId: string | null = null;

const LINE_PREFIX_INFO = 'info';
const LINE_PREFIX_BESTMOVE = 'bestmove';
const LINE_READY = 'uciok';

function post(response: EngineResponse) {
  self.postMessage(response);
}

function sendEngine(command: string) {
  engine.postMessage(command);
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

engine.onmessage = (event: MessageEvent | string) => {
  const line = typeof event === 'string' ? event : event.data;
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
    sendEngine('quit');
  }
};
