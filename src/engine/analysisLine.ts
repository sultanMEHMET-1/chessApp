/**
 * Converts engine UCI analysis lines into SAN-friendly display data.
 */
import type { Square } from 'chess.js';
import { createGameFromFen } from '../chess/rules';
import type { MoveSelection, PromotionPiece } from '../chess/types';
import type { AnalysisLine, EngineAnalysisLine } from './types';

const MAX_PV_PLIES = 10; // Requirement: show the first 8-12 plies; choose 10 for balance.
const UCI_MOVE_MIN_LENGTH = 4; // From+to squares.
const UCI_PROMOTION_LENGTH = 1; // Single promotion character.
const UCI_FROM_START = 0;
const UCI_FROM_END = 2;
const UCI_TO_START = 2;
const UCI_TO_END = 4;
const UCI_PROMOTION_INDEX = 4;

const SQUARE_REGEX = /^[a-h][1-8]$/;
const PROMOTION_PIECES: PromotionPiece[] = ['q', 'r', 'b', 'n'];
const PROMOTION_SET = new Set(PROMOTION_PIECES);

function isSquare(value: string): value is Square {
  return SQUARE_REGEX.test(value);
}

function parseUciMove(uci: string): MoveSelection | null {
  if (uci.length < UCI_MOVE_MIN_LENGTH) {
    return null;
  }

  const from = uci.slice(UCI_FROM_START, UCI_FROM_END);
  const to = uci.slice(UCI_TO_START, UCI_TO_END);

  if (!isSquare(from) || !isSquare(to)) {
    return null;
  }

  let promotion: PromotionPiece | undefined;
  if (uci.length >= UCI_MOVE_MIN_LENGTH + UCI_PROMOTION_LENGTH) {
    const promotionCandidate = uci.charAt(UCI_PROMOTION_INDEX) as PromotionPiece;
    if (PROMOTION_SET.has(promotionCandidate)) {
      promotion = promotionCandidate;
    }
  }

  return {
    from,
    to,
    promotion
  };
}

function convertPvToSan(
  fen: string,
  pvUci: string[]
): { pvSan: string[]; bestMoveSan: string; conversionFailed: boolean } {
  const game = createGameFromFen(fen);
  const pvSan: string[] = [];

  for (const uciMove of pvUci) {
    const selection = parseUciMove(uciMove);
    if (!selection) {
      return { pvSan: [], bestMoveSan: '', conversionFailed: true };
    }

    const applied = game.move(selection);
    if (!applied) {
      return { pvSan: [], bestMoveSan: '', conversionFailed: true };
    }

    pvSan.push(applied.san);
  }

  return {
    pvSan,
    bestMoveSan: pvSan[0] ?? '',
    conversionFailed: false
  };
}

function buildAnalysisLine(fen: string, line: EngineAnalysisLine): AnalysisLine {
  const pvUci = line.pv.slice(0, MAX_PV_PLIES);
  const bestMoveUci = pvUci[0] ?? line.pv[0] ?? '';

  if (!bestMoveUci) {
    return {
      multipv: line.multipv,
      depth: line.depth,
      score: line.score,
      bestMoveUci: '',
      bestMoveSan: '',
      pvUci,
      pvSan: pvUci,
      nodes: line.nodes,
      time: line.time
    };
  }

  try {
    const { pvSan, bestMoveSan, conversionFailed } = convertPvToSan(fen, pvUci);
    return {
      multipv: line.multipv,
      depth: line.depth,
      score: line.score,
      bestMoveUci,
      bestMoveSan: conversionFailed || !bestMoveSan ? bestMoveUci : bestMoveSan,
      pvUci,
      pvSan: conversionFailed ? pvUci : pvSan,
      nodes: line.nodes,
      time: line.time
    };
  } catch (error) {
    return {
      multipv: line.multipv,
      depth: line.depth,
      score: line.score,
      bestMoveUci,
      bestMoveSan: bestMoveUci,
      pvUci,
      pvSan: pvUci,
      nodes: line.nodes,
      time: line.time
    };
  }
}

export { buildAnalysisLine };
