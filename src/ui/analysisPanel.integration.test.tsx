import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENGINE_PROTOCOL_VERSION } from '../engine/types';
import type { EngineAnalysisLine, EngineRequest, EngineResponse } from '../engine/types';
import ChessApp from './ChessApp';

const START_ANALYSIS_LABEL = 'Start Analysis';
const ANALYSIS_LINE_TEST_ID = 'analysis-line-1';
const START_PAWN_SQUARE = 'square-e2';
const TARGET_PAWN_SQUARE = 'square-e4';

const STARTING_BEST_MOVE_UCI = 'e2e4';
const RESPONSE_BEST_MOVE_UCI = 'c7c5';
const SAMPLE_DEPTH = 10;

const ORIGINAL_WORKER = globalThis.Worker;

class MockWorker {
  onmessage: ((event: MessageEvent<EngineResponse>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  postMessage(message: EngineRequest) {
    if (message.type === 'init') {
      this.emit({ version: ENGINE_PROTOCOL_VERSION, type: 'ready' });
      return;
    }

    if (message.type === 'analyze') {
      const bestMove = message.fen.includes(' w ')
        ? STARTING_BEST_MOVE_UCI
        : RESPONSE_BEST_MOVE_UCI;
      const line: EngineAnalysisLine = {
        multipv: 1,
        depth: SAMPLE_DEPTH,
        score: { type: 'cp', value: 12 },
        pv: [bestMove]
      };
      this.emit({
        version: ENGINE_PROTOCOL_VERSION,
        type: 'analysis',
        requestId: message.requestId,
        line
      });
      return;
    }
  }

  terminate() {}

  private emit(response: EngineResponse) {
    this.onmessage?.({ data: response } as MessageEvent<EngineResponse>);
  }
}

describe('Analysis panel integration', () => {
  beforeEach(() => {
    globalThis.Worker = MockWorker as typeof Worker;
  });

  afterEach(() => {
    globalThis.Worker = ORIGINAL_WORKER;
    vi.restoreAllMocks();
  });

  it('updates analysis lines when the FEN changes', async () => {
    const { getByTestId, getByRole } = render(<ChessApp />);

    fireEvent.click(getByRole('button', { name: START_ANALYSIS_LABEL }));

    await waitFor(() => {
      expect(getByTestId(ANALYSIS_LINE_TEST_ID).textContent).toContain('e4');
    });

    fireEvent.click(getByTestId(START_PAWN_SQUARE));
    fireEvent.click(getByTestId(TARGET_PAWN_SQUARE));

    await waitFor(() => {
      expect(getByTestId(ANALYSIS_LINE_TEST_ID).textContent).toContain('c5');
    });
  });
});
