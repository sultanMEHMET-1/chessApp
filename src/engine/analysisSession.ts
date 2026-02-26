import { parseInfoLine, type UciInfo } from './uciParser';

// Tracks analysis requests and discards stale UCI info lines by request ID.
const INITIAL_REQUEST_ID = 0;
const REQUEST_ID_INCREMENT = 1;
const MIN_MULTIPV = 1;

export type AnalysisUpdate = {
  requestId: number;
  line: UciInfo;
  lines: UciInfo[];
};

export class AnalysisSession {
  private currentRequestId: number;
  private linesByMultiPv: Map<number, UciInfo>;

  constructor() {
    this.currentRequestId = INITIAL_REQUEST_ID;
    this.linesByMultiPv = new Map();
  }

  startNewRequest(): number {
    this.currentRequestId += REQUEST_ID_INCREMENT;
    this.linesByMultiPv.clear();
    return this.currentRequestId;
  }

  getCurrentRequestId(): number {
    return this.currentRequestId;
  }

  handleInfoLine(requestId: number, line: string): AnalysisUpdate | null {
    if (requestId !== this.currentRequestId) {
      return null;
    }

    const parsed = parseInfoLine(line);

    if (!parsed || parsed.multipv < MIN_MULTIPV) {
      return null;
    }

    this.linesByMultiPv.set(parsed.multipv, parsed);

    return {
      requestId,
      line: parsed,
      lines: toSortedLines(this.linesByMultiPv)
    };
  }
}

function toSortedLines(linesByMultiPv: Map<number, UciInfo>): UciInfo[] {
  return Array.from(linesByMultiPv.values()).sort(
    (left, right) => left.multipv - right.multipv
  );
}
