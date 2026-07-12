import { describe, expect, it } from "vitest";

import type { BoardState } from "@/lib/board";
import { BLANK_BIT, COLOR_CHIPS } from "@/lib/cells";
import { layoutText, messagesEqual, type ActiveMessage } from "@/lib/layout";

const RED = COLOR_CHIPS.find((c) => c.id === "red")!.char;

/** Read one row of a board back as a string. */
function row(board: BoardState, index: number): string {
  return board.cells.slice(index * board.columns, (index + 1) * board.columns).join("");
}

/** Read the whole board as newline-joined rows. */
function read(board: BoardState): string {
  return Array.from({ length: board.rows }, (_, r) => row(board, r)).join("\n");
}

describe("text-to-grid conversion", () => {
  it("places characters left-to-right on the first row", () => {
    const { board, usedCells } = layoutText("HI", { rows: 2, columns: 4 });
    expect(row(board, 0)).toBe("HI  ");
    expect(row(board, 1)).toBe("    ");
    expect(usedCells).toBe(2);
  });

  it("reports the grid capacity", () => {
    const { totalCells } = layoutText("", { rows: 6, columns: 22 });
    expect(totalCells).toBe(132);
  });
});

describe("normalization", () => {
  it("uppercases input", () => {
    const { board } = layoutText("hi", { rows: 1, columns: 4 });
    expect(row(board, 0)).toBe("HI  ");
  });

  it("collapses internal whitespace and trims the ends", () => {
    const { board } = layoutText("  A   B  ", { rows: 1, columns: 6 });
    expect(row(board, 0)).toBe("A B   ");
  });

  it("drops unsupported characters and reports them once", () => {
    const { board, unsupported } = layoutText("Aé😀B", { rows: 1, columns: 4 });
    expect(row(board, 0)).toBe("AB  ");
    // Reported after uppercasing, so the accented letter surfaces as "É".
    expect(unsupported).toContain("É");
    expect(unsupported).toContain("😀");
  });

  it("preserves blank lines as blank rows", () => {
    const { board } = layoutText("A\n\nB", { rows: 3, columns: 2 });
    expect(read(board)).toBe("A \n  \nB ");
  });
});

describe("wrapping", () => {
  it("wraps on word boundaries across columns", () => {
    const { board } = layoutText("ALPHA BETA", { rows: 2, columns: 6 });
    expect(row(board, 0)).toBe("ALPHA ");
    expect(row(board, 1)).toBe("BETA  ");
  });

  it("hard-splits a word longer than the row", () => {
    const { board } = layoutText("ABCDEFGH", { rows: 2, columns: 4 });
    expect(row(board, 0)).toBe("ABCD");
    expect(row(board, 1)).toBe("EFGH");
  });
});

describe("overflow", () => {
  it("truncates to the available rows and flags overflow", () => {
    const result = layoutText("A\nB\nC\nD", { rows: 2, columns: 2 });
    expect(result.overflow).toBe(true);
    expect(result.board.rows).toBe(2);
    expect(read(result.board)).toBe("A \nB ");
  });

  it("does not flag overflow when the message fits", () => {
    expect(layoutText("A\nB", { rows: 2, columns: 2 }).overflow).toBe(false);
  });
});

describe("line alignment within the block", () => {
  // Line alignment only moves lines relative to each other (within the block
  // width), so it's exercised with lines of differing length.
  it("right-aligns the short line within the block", () => {
    const { board } = layoutText("AAAA\nB", { rows: 2, columns: 4, align: "right" });
    expect(read(board)).toBe("AAAA\n   B");
  });

  it("center-aligns the short line within the block", () => {
    const { board } = layoutText("AAAA\nB", { rows: 2, columns: 4, align: "center" });
    expect(read(board)).toBe("AAAA\n B  ");
  });
});

describe("block positioning on the board", () => {
  it("right-positions the block", () => {
    const { board } = layoutText("HI", { rows: 1, columns: 6, blockAlign: "right" });
    expect(row(board, 0)).toBe("    HI");
  });

  it("center-positions the block", () => {
    const { board } = layoutText("HI", { rows: 1, columns: 6, blockAlign: "center" });
    expect(row(board, 0)).toBe("  HI  ");
  });

  it("keeps lines left-aligned while centering the block (the list case)", () => {
    const { board } = layoutText("AAAA\nB", {
      rows: 2,
      columns: 8,
      align: "left",
      blockAlign: "center",
    });
    // Block width is 4 (widest line), centered in 8 columns => 2-space offset.
    // The short line stays left-aligned within that centered block.
    expect(read(board)).toBe("  AAAA  \n  B     ");
  });
});

describe("vertical positioning", () => {
  it("places the block at the bottom", () => {
    const { board } = layoutText("X", { rows: 3, columns: 1, vAlign: "bottom" });
    expect(read(board)).toBe(" \n \nX");
  });

  it("centers the block vertically", () => {
    const { board } = layoutText("X", { rows: 3, columns: 1, vAlign: "middle" });
    expect(read(board)).toBe(" \nX\n ");
  });
});

describe("special bits", () => {
  it("treats color chips as supported, one-wide, used cells", () => {
    const { board, unsupported, usedCells } = layoutText(`${RED}HI`, { rows: 1, columns: 4 });
    expect(unsupported).toHaveLength(0);
    expect(board.cells[0]).toBe(RED);
    expect(row(board, 0)).toBe(`${RED}HI `);
    expect(usedCells).toBe(3);
  });

  it("keeps a blank/filler bit instead of collapsing it like a space", () => {
    const { board } = layoutText(`A${BLANK_BIT}B`, { rows: 1, columns: 4 });
    expect(board.cells[1]).toBe(BLANK_BIT);
    expect(board.cells[0]).toBe("A");
    expect(board.cells[2]).toBe("B");
  });
});

describe("messagesEqual", () => {
  const base: ActiveMessage = { text: "HI", align: "left", blockAlign: "left", vAlign: "top" };

  it("matches identical messages", () => {
    expect(messagesEqual(base, { ...base })).toBe(true);
  });

  it("distinguishes same text with different positioning", () => {
    expect(messagesEqual(base, { ...base, align: "center" })).toBe(false);
    expect(messagesEqual(base, { ...base, blockAlign: "right" })).toBe(false);
    expect(messagesEqual(base, { ...base, vAlign: "middle" })).toBe(false);
  });
});
