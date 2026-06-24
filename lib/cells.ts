// Special board bits that can't be typed directly. Each occupies exactly one
// cell. Color chips and the blank/filler bit are encoded as single Unicode
// Private Use Area characters (U+E000+) so they flow through the string-based
// draft and layout engine as ordinary one-wide cells. Symbols are real
// characters that simply happen to be awkward to type.

export interface ColorChip {
  id: string;
  /** Sentinel character stored in the draft/board cells. */
  char: string;
  label: string;
  /** CSS color used to paint the chip face. */
  color: string;
}

export interface SymbolBit {
  id: string;
  char: string;
  label: string;
}

/** Build a Private Use Area sentinel character for the given offset. */
const pua = (offset: number): string => String.fromCharCode(0xe000 + offset);

export const COLOR_CHIPS: ColorChip[] = [
  { id: "red", char: pua(0), label: "Red", color: "#df3b34" },
  { id: "orange", char: pua(1), label: "Orange", color: "#e08a2f" },
  { id: "yellow", char: pua(2), label: "Yellow", color: "#e7c93b" },
  { id: "green", char: pua(3), label: "Green", color: "#39a64b" },
  { id: "blue", char: pua(4), label: "Blue", color: "#2f74e0" },
  { id: "violet", char: pua(5), label: "Violet", color: "#7d4fd0" },
  { id: "white", char: pua(6), label: "White", color: "#f1f1ec" },
  { id: "black", char: pua(7), label: "Black", color: "#101010" },
];

/** A deliberately blank cell, distinct from a space (never collapsed). */
export const BLANK_BIT = pua(16);

export const SYMBOL_BITS: SymbolBit[] = [
  { id: "degree", char: "°", label: "Degree" },
  { id: "bullet", char: "•", label: "Bullet" },
];

const COLOR_BY_CHAR = new Map(COLOR_CHIPS.map((chip) => [chip.char, chip]));

export function colorChipForChar(char: string): ColorChip | undefined {
  return COLOR_BY_CHAR.get(char);
}

export function isColorChip(char: string): boolean {
  return COLOR_BY_CHAR.has(char);
}

export function isBlankBit(char: string): boolean {
  return char === BLANK_BIT;
}

/** True for any sentinel-encoded special bit (color chip or blank/filler). */
export function isSpecialBit(char: string): boolean {
  return isColorChip(char) || isBlankBit(char);
}
