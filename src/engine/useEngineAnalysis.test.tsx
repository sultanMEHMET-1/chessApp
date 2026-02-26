import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STARTING_FEN } from '../chess/constants';
import type { AnalysisSettings, EngineRequest } from './types';
import useEngineAnalysis from './useEngineAnalysis';

const SETTINGS: AnalysisSettings = {
  mode: 'depth',
  value: 1,
  multiPv: 3
};

const ORIGINAL_WORKER = globalThis.Worker;

class SilentWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  postMessage(_message: EngineRequest) {}

  terminate() {}
}

type HarnessProps = {
  enabled: boolean;
};

function Harness({ enabled }: HarnessProps) {
  const analysis = useEngineAnalysis({
    fen: STARTING_FEN,
    enabled,
    settings: SETTINGS
  });

  return (
    <div>
      <div data-testid="analysis-status">{analysis.status}</div>
      <div data-testid="analysis-error">{analysis.error ?? ''}</div>
    </div>
  );
}

describe('useEngineAnalysis', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.Worker = SilentWorker as typeof Worker;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    globalThis.Worker = ORIGINAL_WORKER;
  });

  it('surfaces an error when the engine never becomes ready', async () => {
    render(<Harness enabled />);

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId('analysis-status').textContent).toBe('error');
    expect(screen.getByTestId('analysis-error').textContent).toContain('Stockfish');
  });
});
