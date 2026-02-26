import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Board } from "./Board";

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const EXPECTED_KNIGHT_DESTINATIONS = ["a3", "c3"];
const EXPECTED_FEN_AFTER_E4 =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const EXPECTED_SIDE_AFTER_E4 = "Black";

const getLegalDestinations = (board: HTMLElement): string[] =>
  Array.from(
    board.querySelectorAll('[data-legal-destination="true"]')
  )
    .map((element) => element.getAttribute("data-square"))
    .filter((square): square is string => Boolean(square));

const sortSquares = (squares: string[]): string[] => [...squares].sort();

describe("Board integration", () => {
  it("shows the legal destinations for a selected piece", () => {
    render(<Board initialFen={START_FEN} />);

    const board = screen.getByRole("grid", { name: /chess board/i });
    const knightSquare = screen.getByTestId("square-b1");

    fireEvent.click(knightSquare);

    const destinations = getLegalDestinations(board);

    expect(destinations).toHaveLength(EXPECTED_KNIGHT_DESTINATIONS.length);
    expect(sortSquares(destinations)).toEqual(
      sortSquares(EXPECTED_KNIGHT_DESTINATIONS)
    );
  });

  it("updates FEN and side to move after a move", () => {
    render(<Board initialFen={START_FEN} />);

    fireEvent.click(screen.getByTestId("square-e2"));
    fireEvent.click(screen.getByTestId("square-e4"));

    expect(screen.getByTestId("fen-value").textContent).toBe(
      EXPECTED_FEN_AFTER_E4
    );
    expect(screen.getByTestId("side-to-move").textContent).toBe(
      EXPECTED_SIDE_AFTER_E4
    );
  });
});
