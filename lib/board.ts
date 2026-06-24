// Board data model — intentionally independent from the rendering layer
// (currently slot-text) so the renderer can be swapped later.

export const BOARD_ROWS = 6;
export const BOARD_COLUMNS = 22;

/** Value shown in an empty cell. */
export const BLANK = " ";

/** Tile appearance: light = warm cream faces, dark = dark-gray faces. */
export type BoardTheme = "light" | "dark";

export type BoardSizeKey = "flagship" | "note";

export interface BoardSize {
  key: BoardSizeKey;
  rows: number;
  columns: number;
  label: string;
}

/** Selectable board formats: flagship (6×22) and the smaller note (3×15). */
export const BOARD_SIZES: Record<BoardSizeKey, BoardSize> = {
  flagship: { key: "flagship", rows: BOARD_ROWS, columns: BOARD_COLUMNS, label: "6 × 22" },
  note: { key: "note", rows: 3, columns: 15, label: "3 × 15" },
};

export interface BoardState {
  rows: number;
  columns: number;
  /** Flat array of single-character cells, length === rows * columns. */
  cells: string[];
}

/** True when two boards have the same dimensions and identical cells. */
export function boardsEqual(a: BoardState, b: BoardState): boolean {
  if (a.rows !== b.rows || a.columns !== b.columns) return false;
  if (a.cells.length !== b.cells.length) return false;
  return a.cells.every((cell, index) => cell === b.cells[index]);
}

/** Index into the flat `cells` array for a given row/column. */
export function cellIndex(row: number, column: number, columns: number): number {
  return row * columns + column;
}

/**
 * A plain-text reading of the board for assistive technology: rows joined by
 * newlines with trailing blanks trimmed. `describeCell` maps each cell to text
 * (e.g. naming color chips); a returned empty string is treated as blank.
 */
export function boardToText(
  board: BoardState,
  describeCell: (cell: string) => string,
): string {
  const lines: string[] = [];
  for (let row = 0; row < board.rows; row++) {
    let line = "";
    for (let column = 0; column < board.columns; column++) {
      line += describeCell(board.cells[cellIndex(row, column, board.columns)]);
    }
    lines.push(line.replace(/\s+$/, ""));
  }
  return lines.join("\n").replace(/\n+$/, "");
}

/** Create a board of the given size with every cell blank. */
export function createEmptyBoard(
  rows: number = BOARD_ROWS,
  columns: number = BOARD_COLUMNS,
): BoardState {
  return {
    rows,
    columns,
    cells: new Array(rows * columns).fill(BLANK),
  };
}
