import { describe, expect, it } from 'vitest';
import { AnalysisSession } from './analysisSession';
import { parseInfoLine, parseUciInfoLine } from './uciParser';

const INFO_LINE =
  'info depth 12 multipv 2 score cp 34 pv e2e4 e7e5 g1f3';
const EXPECTED_INFO_DEPTH = 12;
const EXPECTED_MULTIPV = 2;
const EXPECTED_SCORE = 34;
const EXPECTED_PV = ['e2e4', 'e7e5', 'g1f3'];
const EXPECTED_PV_LENGTH = 3;

const REQUEST_COUNT = 2;
const FIRST_REQUEST_INDEX = 0;
const SECOND_REQUEST_INDEX = 1;
const EXPECTED_LINE_COUNT = 1;

const SAMPLE_INFO =
  'info depth 15 seldepth 20 multipv 2 score cp 34 nodes 12345 time 120 pv e2e4 e7e5 g1f3';
const MATE_INFO = 'info depth 9 score mate -3 pv f7f8q';

const EXPECTED_SAMPLE_DEPTH = 15;
const EXPECTED_NODES = 12345;
const EXPECTED_TIME = 120;

function expectParsedLine() {
  const parsed = parseInfoLine(INFO_LINE);
  expect(parsed).not.toBeNull();

  if (!parsed) {
    throw new Error('Expected UCI info line to parse.');
  }

  expect(parsed.depth).toBe(EXPECTED_INFO_DEPTH);
  expect(parsed.multipv).toBe(EXPECTED_MULTIPV);
  expect(parsed.score.type).toBe('cp');
  expect(parsed.score.value).toBe(EXPECTED_SCORE);
  expect(parsed.pv).toHaveLength(EXPECTED_PV_LENGTH);
  expect(parsed.pv).toEqual(EXPECTED_PV);
}

describe('parseInfoLine', () => {
  it('parses MultiPV info lines into structured data', () => {
    expectParsedLine();
  });
});

describe('AnalysisSession', () => {
  it('discards stale analysis updates by request id', () => {
    const session = new AnalysisSession();
    const requestIds = [
      session.startNewRequest(),
      session.startNewRequest()
    ];

    expect(requestIds).toHaveLength(REQUEST_COUNT);

    const firstUpdate = session.handleInfoLine(
      requestIds[FIRST_REQUEST_INDEX],
      INFO_LINE
    );
    expect(firstUpdate).toBeNull();

    const secondUpdate = session.handleInfoLine(
      requestIds[SECOND_REQUEST_INDEX],
      INFO_LINE
    );

    expect(secondUpdate).not.toBeNull();
    if (!secondUpdate) {
      throw new Error('Expected current request update to be accepted.');
    }

    expect(secondUpdate.lines).toHaveLength(EXPECTED_LINE_COUNT);
  });
});

describe('parseUciInfoLine', () => {
  it('parses multiPV info lines with cp scores', () => {
    const parsed = parseUciInfoLine(SAMPLE_INFO);

    expect(parsed).not.toBeNull();
    expect(parsed?.multipv).toBe(EXPECTED_MULTIPV);
    expect(parsed?.depth).toBe(EXPECTED_SAMPLE_DEPTH);
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
