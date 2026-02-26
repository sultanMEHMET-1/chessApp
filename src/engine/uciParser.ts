/**
 * UCI info line parser for MultiPV analysis output.
 */
import type { AnalysisLine, Score } from './types';

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
const MIN_TOKENS = 2; // At least "info" plus another token.

function parseScore(tokens: string[], index: number): Score | null {
  const scoreType = tokens[index];
  const rawValue = tokens[index + 1];
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

function parseUciInfoLine(line: string): AnalysisLine | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < MIN_TOKENS || tokens[0] !== TOKEN_INFO) {
    return null;
  }

  let depth: number | undefined;
  let multipv = DEFAULT_MULTIPV;
  let score: Score | null = null;
  let pv: string[] = [];
  let nodes: number | undefined;
  let time: number | undefined;

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === TOKEN_DEPTH && tokens[index + 1]) {
      depth = Number(tokens[index + 1]);
      index += 1;
      continue;
    }
    if (token === TOKEN_MULTIPV && tokens[index + 1]) {
      multipv = Number(tokens[index + 1]);
      index += 1;
      continue;
    }
    if (token === TOKEN_SCORE) {
      score = parseScore(tokens, index + 1);
      if (score) {
        index += 2;
      }
      continue;
    }
    if (token === TOKEN_NODES && tokens[index + 1]) {
      nodes = Number(tokens[index + 1]);
      index += 1;
      continue;
    }
    if (token === TOKEN_TIME && tokens[index + 1]) {
      time = Number(tokens[index + 1]);
      index += 1;
      continue;
    }
    if (token === TOKEN_PV) {
      pv = tokens.slice(index + 1);
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

export { parseUciInfoLine };
