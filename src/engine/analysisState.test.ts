import { describe, expect, it } from 'vitest';
import { analysisReducer, createInitialAnalysisState } from './analysisState';
import type { AnalysisLine } from './types';

const REQUEST_ID = 'analysis-1';
const STALE_REQUEST_ID = 'analysis-0';

const SAMPLE_LINE: AnalysisLine = {
  multipv: 1,
  depth: 12,
  score: { type: 'cp', value: 18 },
  pv: ['e2e4', 'e7e5']
};

const STALE_LINE: AnalysisLine = {
  multipv: 2,
  depth: 10,
  score: { type: 'cp', value: -12 },
  pv: ['d2d4', 'd7d5']
};

describe('analysisReducer', () => {
  it('starts a new analysis run and clears lines', () => {
    const state = analysisReducer(createInitialAnalysisState(), {
      type: 'start',
      requestId: REQUEST_ID
    });

    expect(state.status).toBe('running');
    expect(state.lines).toHaveLength(0);
    expect(state.requestId).toBe(REQUEST_ID);
  });

  it('ignores stale analysis responses', () => {
    const started = analysisReducer(createInitialAnalysisState(), {
      type: 'start',
      requestId: REQUEST_ID
    });
    const updated = analysisReducer(started, {
      type: 'line',
      requestId: REQUEST_ID,
      line: SAMPLE_LINE
    });
    const stale = analysisReducer(updated, {
      type: 'line',
      requestId: STALE_REQUEST_ID,
      line: STALE_LINE
    });

    expect(stale.lines).toEqual(updated.lines);
  });
});
