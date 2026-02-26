import { describe, expect, it } from 'vitest';
import { parseUciInfoLine } from './uciParser';

const SAMPLE_INFO =
  'info depth 15 seldepth 20 multipv 2 score cp 34 nodes 12345 time 120 pv e2e4 e7e5 g1f3';
const MATE_INFO = 'info depth 9 score mate -3 pv f7f8q';

const EXPECTED_MULTIPV = 2;
const EXPECTED_DEPTH = 15;
const EXPECTED_SCORE = 34;
const EXPECTED_NODES = 12345;
const EXPECTED_TIME = 120;

describe('parseUciInfoLine', () => {
  it('parses multiPV info lines with cp scores', () => {
    const parsed = parseUciInfoLine(SAMPLE_INFO);

    expect(parsed).not.toBeNull();
    expect(parsed?.multipv).toBe(EXPECTED_MULTIPV);
    expect(parsed?.depth).toBe(EXPECTED_DEPTH);
    expect(parsed?.score).toEqual({ type: 'cp', value: EXPECTED_SCORE });
    expect(parsed?.nodes).toBe(EXPECTED_NODES);
    expect(parsed?.time).toBe(EXPECTED_TIME);
    expect(parsed?.pv).toEqual(['e2e4', 'e7e5', 'g1f3']);
  });

  it('parses mate scores', () => {
    const parsed = parseUciInfoLine(MATE_INFO);

    expect(parsed?.score).toEqual({ type: 'mate', value: -3 });
  });

  it('returns null for non-info lines', () => {
    expect(parseUciInfoLine('bestmove e2e4')).toBeNull();
  });
});
