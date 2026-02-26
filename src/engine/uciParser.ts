// Parses UCI "info" lines into structured analysis data for MultiPV output.
const TOKEN_SEPARATOR = /\s+/;
const INFO_PREFIX = 'info';
const DEPTH_TOKEN = 'depth';
const MULTIPV_TOKEN = 'multipv';
const SCORE_TOKEN = 'score';
const PV_TOKEN = 'pv';
const CP_SCORE_TOKEN = 'cp';
const MATE_SCORE_TOKEN = 'mate';
const MIN_DEPTH = 0;
const MIN_MULTIPV = 1;
const INDEX_OFFSET_ONE = 1;
const INDEX_OFFSET_TWO = 2;

export type ScoreType = 'cp' | 'mate';

export type Score = {
  type: ScoreType;
  value: number;
};

export type UciInfo = {
  depth: number;
  multipv: number;
  score: Score;
  pv: string[];
};

export function parseInfoLine(line: string): UciInfo | null {
  const tokens = line.trim().split(TOKEN_SEPARATOR);

  if (tokens[0] !== INFO_PREFIX) {
    return null;
  }

  let depth: number | null = null;
  let multipv: number | null = null;
  let scoreType: ScoreType | null = null;
  let scoreValue: number | null = null;
  let pv: string[] = [];

  for (let index = INDEX_OFFSET_ONE; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === DEPTH_TOKEN) {
      depth = parseRequiredInteger(tokens[index + INDEX_OFFSET_ONE], MIN_DEPTH);
      index += INDEX_OFFSET_ONE;
      continue;
    }

    if (token === MULTIPV_TOKEN) {
      multipv = parseRequiredInteger(
        tokens[index + INDEX_OFFSET_ONE],
        MIN_MULTIPV
      );
      index += INDEX_OFFSET_ONE;
      continue;
    }

    if (token === SCORE_TOKEN) {
      const nextToken = tokens[index + INDEX_OFFSET_ONE];
      const valueToken = tokens[index + INDEX_OFFSET_TWO];

      if (nextToken === CP_SCORE_TOKEN || nextToken === MATE_SCORE_TOKEN) {
        scoreType = nextToken;
        scoreValue = parseSignedInteger(valueToken);
      }

      index += INDEX_OFFSET_TWO;
      continue;
    }

    if (token === PV_TOKEN) {
      pv = tokens.slice(index + INDEX_OFFSET_ONE);
      break;
    }
  }

  if (
    depth === null ||
    multipv === null ||
    scoreType === null ||
    scoreValue === null
  ) {
    return null;
  }

  return {
    depth,
    multipv,
    score: {
      type: scoreType,
      value: scoreValue
    },
    pv
  };
}

function parseRequiredInteger(value: string | undefined, minValue: number):
  | number
  | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < minValue) {
    return null;
  }

  return parsedValue;
}

function parseSignedInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    return null;
  }

  return parsedValue;
}
