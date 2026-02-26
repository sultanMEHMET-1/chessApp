/**
 * UCI info line parsing helpers for analysis output.
 */
import type { EngineAnalysisLine, Score } from './types';

const TOKEN_SEPARATOR = /\s+/;
const TOKEN_INFO = 'info';
const TOKEN_DEPTH = 'depth';
const TOKEN_MULTIPV = 'multipv';
const TOKEN_SCORE = 'score';
const TOKEN_PV = 'pv';
const TOKEN_NODES = 'nodes';
const TOKEN_TIME = 'time';
const TOKEN_CP = 'cp';
const TOKEN_MATE = 'mate';

const DEFAULT_MULTIPV = 1; // UCI defaults to the first line.
const MIN_DEPTH = 0;
const MIN_MULTIPV = 1;
const MIN_TOKENS = 2; // At least "info" plus another token.
const INDEX_OFFSET_ONE = 1;
const INDEX_OFFSET_TWO = 2;

export type UciInfo = {
  depth: number;
  multipv: number;
  score: Score;
  pv: string[];
};

export function parseInfoLine(line: string): UciInfo | null {
  const tokens = line.trim().split(TOKEN_SEPARATOR);

  if (tokens[0] !== TOKEN_INFO) {
    return null;
  }

  let depth: number | null = null;
  let multipv: number | null = null;
  let score: Score | null = null;
  let pv: string[] = [];

  for (let index = INDEX_OFFSET_ONE; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === TOKEN_DEPTH) {
      depth = parseRequiredInteger(tokens[index + INDEX_OFFSET_ONE], MIN_DEPTH);
      index += INDEX_OFFSET_ONE;
      continue;
    }

    if (token === TOKEN_MULTIPV) {
      multipv = parseRequiredInteger(
        tokens[index + INDEX_OFFSET_ONE],
        MIN_MULTIPV
      );
      index += INDEX_OFFSET_ONE;
      continue;
    }

    if (token === TOKEN_SCORE) {
      score = parseScore(tokens, index + INDEX_OFFSET_ONE);
      if (score) {
        index += INDEX_OFFSET_TWO;
      }
      continue;
    }

    if (token === TOKEN_PV) {
      pv = tokens.slice(index + INDEX_OFFSET_ONE);
      break;
    }
  }

  if (depth === null || multipv === null || !score) {
    return null;
  }

  return {
    depth,
    multipv,
    score,
    pv
  };
}

function parseScore(tokens: string[], index: number): Score | null {
  const scoreType = tokens[index];
  const rawValue = tokens[index + INDEX_OFFSET_ONE];
  if (!scoreType || rawValue === undefined) {
    return null;
  }
  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    return null;
  }
  if (scoreType === TOKEN_CP) {
    return { type: 'cp', value: parsedValue };
  }
  if (scoreType === TOKEN_MATE) {
    return { type: 'mate', value: parsedValue };
  }
  return null;
}

export function parseUciInfoLine(line: string): EngineAnalysisLine | null {
  const tokens = line.trim().split(TOKEN_SEPARATOR);
  if (tokens.length < MIN_TOKENS || tokens[0] !== TOKEN_INFO) {
    return null;
  }

  let depth: number | undefined;
  let multipv = DEFAULT_MULTIPV;
  let score: Score | null = null;
  let pv: string[] = [];
  let nodes: number | undefined;
  let time: number | undefined;

  for (let index = INDEX_OFFSET_ONE; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === TOKEN_DEPTH && tokens[index + INDEX_OFFSET_ONE]) {
      depth = Number(tokens[index + INDEX_OFFSET_ONE]);
      index += INDEX_OFFSET_ONE;
      continue;
    }
    if (token === TOKEN_MULTIPV && tokens[index + INDEX_OFFSET_ONE]) {
      multipv = Number(tokens[index + INDEX_OFFSET_ONE]);
      index += INDEX_OFFSET_ONE;
      continue;
    }
    if (token === TOKEN_SCORE) {
      score = parseScore(tokens, index + INDEX_OFFSET_ONE);
      if (score) {
        index += INDEX_OFFSET_TWO;
      }
      continue;
    }
    if (token === TOKEN_NODES && tokens[index + INDEX_OFFSET_ONE]) {
      nodes = Number(tokens[index + INDEX_OFFSET_ONE]);
      index += INDEX_OFFSET_ONE;
      continue;
    }
    if (token === TOKEN_TIME && tokens[index + INDEX_OFFSET_ONE]) {
      time = Number(tokens[index + INDEX_OFFSET_ONE]);
      index += INDEX_OFFSET_ONE;
      continue;
    }
    if (token === TOKEN_PV) {
      pv = tokens.slice(index + INDEX_OFFSET_ONE);
      break;
    }
  }

  if (depth === undefined || !score || pv.length === 0) {
    return null;
  }

  return {
    multipv,
    depth,
    score,
    pv,
    nodes,
    time
  };
}

function parseRequiredInteger(value: string | undefined, minValue: number): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < minValue) {
    return null;
  }

  return parsedValue;
}
