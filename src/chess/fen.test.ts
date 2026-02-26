import { describe, expect, it } from 'vitest';
import { createEditorPositionFromFen, validateEditorPosition } from './fen';

const BOTH_KINGS_CHECK_FEN = '4k3/4R3/8/8/8/8/4r3/4K3 w - - 0 1';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const BOTH_KINGS_CHECK_MESSAGE = 'Both kings cannot be in check at the same time.';

describe('validateEditorPosition', () => {
  it('rejects positions with both kings in check by default', () => {
    const position = createEditorPositionFromFen(BOTH_KINGS_CHECK_FEN);
    const validation = validateEditorPosition(position);

    expect(validation.ok).toBe(false);
    expect(validation.error).toBe(BOTH_KINGS_CHECK_MESSAGE);
  });

  it('allows both kings in check when illegal positions are permitted', () => {
    const position = createEditorPositionFromFen(BOTH_KINGS_CHECK_FEN);
    const validation = validateEditorPosition({ ...position, allowIllegal: true });

    expect(validation.ok).toBe(true);
    expect(validation.warning).toBe(BOTH_KINGS_CHECK_MESSAGE);
  });

  it('accepts standard positions without warnings', () => {
    const position = createEditorPositionFromFen(START_FEN);
    const validation = validateEditorPosition(position);

    expect(validation.ok).toBe(true);
    expect(validation.warning).toBeUndefined();
  });
});
