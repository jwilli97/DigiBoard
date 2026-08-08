/**
 * localStorage keys shared between the composer page and /present. Both pages
 * read the same keys through useLocalStorage, whose cross-tab sync is what
 * lets a composer tab drive a presentation tab on the same device.
 */
export const STORAGE_KEYS = {
  /** Active program driving the board (Program). */
  program: "digiboard:program",
  /** Board format (BoardSizeKey). */
  size: "digiboard:size",
  /** Tile theme (BoardTheme). */
  theme: "digiboard:theme",
  /** Flutter sound toggle (boolean). */
  sound: "digiboard:sound",
  /** Recent messages (ActiveMessage[]). */
  history: "digiboard:history",
  /** Saved sequence scenes (ActiveMessage[]), kept for editing between plays. */
  scenes: "digiboard:scenes",
} as const;
