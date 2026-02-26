import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChessApp from './ChessApp';

const START_PAWN_SQUARE = 'square-e2';
const LEGAL_DESTINATIONS = ['square-e3', 'square-e4'];
const EXPECTED_DESTINATION_COUNT = 2;
const EXPECTED_FEN_AFTER_E4 =
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

describe('ChessApp integration', () => {
  it('shows exactly the legal destinations for a selected piece', () => {
    const { getByTestId, container } = render(<ChessApp />);

    fireEvent.click(getByTestId(START_PAWN_SQUARE));

    const legalSquares = Array.from(
      container.querySelectorAll('[data-legal-destination="true"]')
    ).map((element) => element.getAttribute('data-testid'));

    expect(legalSquares).toHaveLength(EXPECTED_DESTINATION_COUNT);
    expect(legalSquares).toEqual(expect.arrayContaining(LEGAL_DESTINATIONS));
  });

  it('updates FEN and side to move after a legal move', () => {
    const { getByTestId } = render(<ChessApp />);

    fireEvent.click(getByTestId(START_PAWN_SQUARE));
    fireEvent.click(getByTestId('square-e4'));

    expect(getByTestId('fen').textContent).toBe(EXPECTED_FEN_AFTER_E4);
    expect(getByTestId('side-to-move').textContent).toContain('Black');
  });
});
