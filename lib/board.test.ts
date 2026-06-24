import { describe, expect, it } from "vitest";

import {
  BLANK,
  BOARD_SIZES,
  boardsEqual,
  cellIndex,
  createEmptyBoard,
} from "@/lib/board";

describe("createEmptyBoard", () => {
  it("fills every cell with a blank at the requested size", () => {
    const board = createEmptyBoard(3, 4);
    expect(board.rows).toBe(3);
    expect(board.columns).toBe(4);
    expect(board.cells).toHaveLength(12);
    expect(board.cells.every((cell) => cell === BLANK)).toBe(true);
  });

  it("defaults to the flagship 6x22 grid", () => {
    const board = createEmptyBoard();
    expect(board.cells).toHaveLength(BOARD_SIZES.flagship.rows * BOARD_SIZES.flagship.columns);
  });
});

describe("cellIndex", () => {
  it("maps row/column to a flat index", () => {
    expect(cellIndex(0, 0, 22)).toBe(0);
    expect(cellIndex(0, 5, 22)).toBe(5);
    expect(cellIndex(2, 3, 22)).toBe(47);
  });
});

describe("boardsEqual", () => {
  it("is true for identical boards and false otherwise", () => {
    const a = createEmptyBoard(2, 2);
    const b = createEmptyBoard(2, 2);
    expect(boardsEqual(a, b)).toBe(true);

    b.cells[0] = "X";
    expect(boardsEqual(a, b)).toBe(false);
  });

  it("is false when dimensions differ", () => {
    expect(boardsEqual(createEmptyBoard(2, 2), createEmptyBoard(2, 3))).toBe(false);
  });
});
