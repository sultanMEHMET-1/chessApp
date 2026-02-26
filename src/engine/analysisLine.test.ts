import { describe, expect, it } from 'vitest';
import { STARTING_FEN } from '../chess/constants';
import { buildAnalysisLine } from './analysisLine';
import type { EngineAnalysisLine } from './types';

const EXPECTED_MAX_PV_PLIES = 10; // Matches analysisLine MAX_PV_PLIES constant.

const BASE_LINE: EngineAnalysisLine = {
  multipv: 1,
  depth: 12,
  score: { type: 'cp', value: 24 },
  pv: []
};

describe('buildAnalysisLine', () => {
  it('converts PV moves into SAN and best move labels', () => {
    const line = buildAnalysisLine(STARTING_FEN, {
      ...BASE_LINE,
      pv: ['e2e4', 'e7e5', 'g1f3']
    });

    expect(line.bestMoveUci).toBe('e2e4');
    expect(line.bestMoveSan).toBe('e4');
    expect(line.pvSan).toEqual(['e4', 'e5', 'Nf3']);
  });

  it('truncates PV to the configured maximum', () => {
    const longPv = Array.from({ length: EXPECTED_MAX_PV_PLIES + 2 }, () => 'e2e4');

    const line = buildAnalysisLine(STARTING_FEN, {
      ...BASE_LINE,
      pv: longPv
    });

    expect(line.pvUci).toHaveLength(EXPECTED_MAX_PV_PLIES);
  });

  it('falls back to UCI when SAN conversion fails', () => {
    const line = buildAnalysisLine(STARTING_FEN, {
      ...BASE_LINE,
      pv: ['a1a1']
    });

    expect(line.bestMoveSan).toBe('a1a1');
    expect(line.pvSan).toEqual(['a1a1']);
  });
});
