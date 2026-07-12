// Text layout engine: turns a free-form draft string into a fixed board grid.
// Kept separate from the board data model and the renderer so each can evolve
// independently.

import {
  BLANK,
  BOARD_COLUMNS,
  BOARD_ROWS,
  cellIndex,
  createEmptyBoard,
  type BoardState,
} from "@/lib/board";
import { isSupportedChar } from "@/lib/charset";
import { isSpecialBit } from "@/lib/cells";

export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";

/** A message plus the positioning used to lay it onto the board. */
export interface ActiveMessage {
  text: string;
  align: HorizontalAlign;
  blockAlign: HorizontalAlign;
  vAlign: VerticalAlign;
}

/** True when two messages have the same text and positioning. */
export function messagesEqual(a: ActiveMessage, b: ActiveMessage): boolean {
  return (
    a.text === b.text &&
    a.align === b.align &&
    a.blockAlign === b.blockAlign &&
    a.vAlign === b.vAlign
  );
}

/** What the board shows before anything has been activated. */
export const DEFAULT_MESSAGE: ActiveMessage = {
  text: "HELLO WORLD",
  align: "left",
  blockAlign: "left",
  vAlign: "top",
};

export interface LayoutOptions {
  /** How each line aligns within the text block. */
  align?: HorizontalAlign;
  /** Where the text block sits horizontally on the board. */
  blockAlign?: HorizontalAlign;
  /** Where the text block sits vertically on the board. */
  vAlign?: VerticalAlign;
  rows?: number;
  columns?: number;
}

export interface LayoutResult {
  board: BoardState;
  /** Distinct unsupported characters that were dropped during normalization. */
  unsupported: string[];
  /** True when content was cut because it exceeded the grid. */
  overflow: boolean;
  /** Non-blank cells used by the message. */
  usedCells: number;
  /** Total cells available on the grid (rows * columns). */
  totalCells: number;
}

/** Supported text glyphs (see lib/charset) plus the sentinel special bits. */
function isSupported(char: string): boolean {
  return isSupportedChar(char) || isSpecialBit(char);
}

/**
 * Normalize a raw draft line: uppercase, collapse internal whitespace runs to a
 * single space, trim the ends, and drop unsupported characters (recording which
 * ones were dropped). Blank lines survive as empty strings so vertical spacing
 * is preserved.
 */
function normalizeLine(line: string, dropped: Set<string>): string {
  let result = "";
  let pendingSpace = false;

  for (const rawChar of line.toUpperCase()) {
    const char = rawChar === "\t" ? " " : rawChar;

    if (char === " ") {
      pendingSpace = true;
      continue;
    }

    if (!isSupported(char)) {
      dropped.add(rawChar);
      continue;
    }

    if (pendingSpace && result.length > 0) result += " ";
    pendingSpace = false;
    result += char;
  }

  return result;
}

/**
 * Greedy word-wrap a single normalized line into physical rows no wider than
 * `columns`. Words longer than a row are hard-split. An empty line yields a
 * single blank row.
 */
function wrapLine(line: string, columns: number): string[] {
  if (line.length === 0) return [""];

  const rows: string[] = [];
  let current = "";

  for (const word of line.split(" ")) {
    if (word.length > columns) {
      // Flush the current row, then hard-split the oversized word.
      if (current.length > 0) {
        rows.push(current);
        current = "";
      }
      let remaining = word;
      while (remaining.length > columns) {
        rows.push(remaining.slice(0, columns));
        remaining = remaining.slice(columns);
      }
      current = remaining;
      continue;
    }

    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= columns) {
      current = candidate;
    } else {
      rows.push(current);
      current = word;
    }
  }

  rows.push(current);
  return rows;
}

/** Pad a row to `width` according to the horizontal alignment. */
function alignRow(row: string, width: number, align: HorizontalAlign): string {
  const padding = width - row.length;
  if (padding <= 0) return row.slice(0, width);

  switch (align) {
    case "right":
      return BLANK.repeat(padding) + row;
    case "center": {
      const left = Math.floor(padding / 2);
      return BLANK.repeat(left) + row + BLANK.repeat(padding - left);
    }
    default:
      return row + BLANK.repeat(padding);
  }
}

/** Left padding to position a block of `width` within `columns`. */
function blockOffset(width: number, columns: number, align: HorizontalAlign): number {
  const padding = columns - width;
  if (padding <= 0) return 0;

  switch (align) {
    case "right":
      return padding;
    case "center":
      return Math.floor(padding / 2);
    default:
      return 0;
  }
}

/** Distribute blank rows above/below the content per vertical alignment. */
function alignRowsVertically(
  rows: string[],
  totalRows: number,
  vAlign: VerticalAlign,
): string[] {
  const padding = totalRows - rows.length;
  if (padding <= 0) return rows;

  const blank = "";
  switch (vAlign) {
    case "bottom":
      return [...new Array(padding).fill(blank), ...rows];
    case "middle": {
      const top = Math.floor(padding / 2);
      return [
        ...new Array(top).fill(blank),
        ...rows,
        ...new Array(padding - top).fill(blank),
      ];
    }
    default:
      return [...rows, ...new Array(padding).fill(blank)];
  }
}

/**
 * Lay a draft message onto the board. Handles normalization, wrapping,
 * alignment, vertical positioning, and overflow reporting.
 */
export function layoutText(text: string, options: LayoutOptions = {}): LayoutResult {
  const {
    align = "left",
    blockAlign = "left",
    vAlign = "top",
    rows = BOARD_ROWS,
    columns = BOARD_COLUMNS,
  } = options;

  const dropped = new Set<string>();

  // Preserve explicit line breaks (and therefore blank lines) before wrapping.
  const wrapped = text
    .split("\n")
    .map((line) => normalizeLine(line, dropped))
    .flatMap((line) => wrapLine(line, columns));

  const overflow = wrapped.length > rows;
  const visibleRows = overflow ? wrapped.slice(0, rows) : wrapped;
  const positioned = alignRowsVertically(visibleRows, rows, vAlign);

  // The block is only as wide as its widest line, so line alignment happens
  // within that block and the block as a whole is positioned on the board.
  const blockWidth = Math.min(
    columns,
    positioned.reduce((max, row) => Math.max(max, row.length), 0),
  );
  const offset = blockOffset(blockWidth, columns, blockAlign);

  const board = createEmptyBoard(rows, columns);
  let usedCells = 0;

  positioned.forEach((row, rowIndex) => {
    const aligned = alignRow(row, blockWidth, align);
    for (let i = 0; i < aligned.length; i++) {
      const column = offset + i;
      if (column >= columns) break;
      const char = aligned[i];
      board.cells[cellIndex(rowIndex, column, columns)] = char;
      if (char !== BLANK) usedCells++;
    }
  });

  return {
    board,
    unsupported: [...dropped],
    overflow,
    usedCells,
    totalCells: rows * columns,
  };
}

/** Lay an active message onto a board of the given dimensions. */
export function layoutMessage(
  message: ActiveMessage,
  size: { rows: number; columns: number },
): LayoutResult {
  return layoutText(message.text, {
    align: message.align,
    blockAlign: message.blockAlign,
    vAlign: message.vAlign,
    rows: size.rows,
    columns: size.columns,
  });
}
