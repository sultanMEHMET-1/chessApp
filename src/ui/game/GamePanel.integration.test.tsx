import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GamePanel } from "./GamePanel";

const SIMPLE_PGN = "1. e4 e5 2. Nf3 Nc6";
const EXPECTED_FEN =
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
const EXPECTED_MOVE_LABELS = [
  "Move 1 White e4",
  "Move 1 Black e5",
  "Move 2 White Nf3",
  "Move 2 Black Nc6"
];

describe("GamePanel integration", () => {
  it("imports PGN and updates the board and move list", () => {
    render(<GamePanel />);

    fireEvent.change(screen.getByLabelText(/pgn import/i), {
      target: { value: SIMPLE_PGN }
    });
    fireEvent.click(screen.getByRole("button", { name: /import pgn/i }));

    expect(screen.getByTestId("fen-value").textContent).toBe(EXPECTED_FEN);

    EXPECTED_MOVE_LABELS.forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });
});
