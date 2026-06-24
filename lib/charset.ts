// The single source of truth for which text glyphs the board can display.
// Both message validation (lib/layout) and the split-flap roll wheel
// (SlotTextBit) derive from this, so they can never drift apart. Color chips and
// the blank/filler bit are separate special cells (see lib/cells).

import { BLANK } from "@/lib/board";

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const DIGITS = "0123456789";
/** Vestaboard-like punctuation, plus a bullet for lists. */
export const PUNCTUATION = "!@#$()-+&=;:'\"%,./?°•";

/**
 * Every supported text glyph, in flap-wheel order: blank first, then letters,
 * digits, and punctuation. This doubles as the ordered "character map" and as
 * the sequence a split-flap cell rolls through.
 */
export const SUPPORTED_CHARS = `${BLANK}${LETTERS}${DIGITS}${PUNCTUATION}`;

const SUPPORTED_SET = new Set(SUPPORTED_CHARS);

/** True when a single character is a supported text glyph (including blank). */
export function isSupportedChar(char: string): boolean {
  return SUPPORTED_SET.has(char);
}
