import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Board } from "./Board";

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const EXPECTED_KNIGHT_DESTINATIONS = ["a3", "c3"];
const EXPECTED_FEN_AFTER_E4 =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const EXPECTED_FEN_AFTER_E5 =
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const EXPECTED_SIDE_AFTER_E4 = "Black";
const EXPECTED_SIDE_AT_START = "White";
const EXPECTED_SIDE_AFTER_E5 = "White";
const EXPECTED_MOVE_E4 = "e4";
const EXPECTED_MOVE_E5 = "e5";
const MOVE_HISTORY_TEST_ID = "move-history";
const NAV_START_TEST_ID = "nav-start";
const NAV_BACK_TEST_ID = "nav-back";
const NAV_FORWARD_TEST_ID = "nav-forward";
const NAV_END_TEST_ID = "nav-end";
const WHITE_OPENING_FROM = "e2";
const WHITE_OPENING_TO = "e4";
const BLACK_OPENING_FROM = "e7";
const BLACK_OPENING_TO = "e5";

const getLegalDestinations = (board: HTMLElement): string[] =>
  Array.from(board.querySelectorAll('[data-legal-destination="true"]'))
    .map((element) => element.getAttribute("data-square"))
    .filter((square): square is string => Boolean(square));

const sortSquares = (squares: string[]): string[] => [...squares].sort();

const makeMove = (from: string, to: string) => {
  fireEvent.click(screen.getByTestId(`square-${from}`));
  fireEvent.click(screen.getByTestId(`square-${to}`));
};

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

    makeMove(WHITE_OPENING_FROM, WHITE_OPENING_TO);

    expect(screen.getByTestId("fen-value").textContent).toBe(
      EXPECTED_FEN_AFTER_E4
    );
    expect(screen.getByTestId("side-to-move").textContent).toBe(
      EXPECTED_SIDE_AFTER_E4
    );
  });

  it("adds moves to the history list", () => {
    render(<Board initialFen={START_FEN} />);

    makeMove(WHITE_OPENING_FROM, WHITE_OPENING_TO);
    makeMove(BLACK_OPENING_FROM, BLACK_OPENING_TO);

    const history = screen.getByTestId(MOVE_HISTORY_TEST_ID);

    expect(within(history).getByText(EXPECTED_MOVE_E4)).toBeInTheDocument();
    expect(within(history).getByText(EXPECTED_MOVE_E5)).toBeInTheDocument();
  });

  it("navigates through history and updates the board position", () => {
    render(<Board initialFen={START_FEN} />);

    makeMove(WHITE_OPENING_FROM, WHITE_OPENING_TO);
    makeMove(BLACK_OPENING_FROM, BLACK_OPENING_TO);

    fireEvent.click(screen.getByTestId(NAV_START_TEST_ID));

    expect(screen.getByTestId("fen-value").textContent).toBe(START_FEN);
    expect(screen.getByTestId("side-to-move").textContent).toBe(
      EXPECTED_SIDE_AT_START
    );

    fireEvent.click(screen.getByTestId(NAV_FORWARD_TEST_ID));

    expect(screen.getByTestId("fen-value").textContent).toBe(
      EXPECTED_FEN_AFTER_E4
    );
    expect(screen.getByTestId("side-to-move").textContent).toBe(
      EXPECTED_SIDE_AFTER_E4
    );

    fireEvent.click(screen.getByTestId(NAV_END_TEST_ID));

    expect(screen.getByTestId("fen-value").textContent).toBe(
      EXPECTED_FEN_AFTER_E5
    );
    expect(screen.getByTestId("side-to-move").textContent).toBe(
      EXPECTED_SIDE_AFTER_E5
    );

    fireEvent.click(screen.getByTestId(NAV_BACK_TEST_ID));

    expect(screen.getByTestId("fen-value").textContent).toBe(
      EXPECTED_FEN_AFTER_E4
    );
  });
});
