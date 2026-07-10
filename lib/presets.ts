// Saved sample messages and random-board helpers for the presets/delight tools.

import { DIGITS, LETTERS } from "@/lib/charset";
import { COLOR_CHIPS } from "@/lib/cells";
import type { ActiveMessage, HorizontalAlign, VerticalAlign } from "@/lib/layout";

export interface Preset {
  id: string;
  label: string;
  text: string;
  align?: HorizontalAlign;
  blockAlign?: HorizontalAlign;
  vAlign?: VerticalAlign;
}

/** Sentinel character for a named color chip, for embedding in preset text. */
function chip(id: string): string {
  return COLOR_CHIPS.find((c) => c.id === id)?.char ?? "";
}

export const PRESETS: Preset[] = [
  {
    id: "hello",
    label: "Hello",
    text: "HELLO WORLD",
    blockAlign: "center",
    vAlign: "middle",
  },
  {
    id: "quote",
    label: "Quote",
    text: "STAY HUNGRY\nSTAY FOOLISH",
    align: "center",
    blockAlign: "center",
    vAlign: "middle",
  },
  {
    id: "weather",
    label: "Weather",
    text: `${chip("yellow")} SUNNY 72°\nWIND 5 MPH NW`,
    blockAlign: "center",
    vAlign: "middle",
  },
  {
    id: "menu",
    label: "Menu",
    text: "TODAYS SPECIAL\n• MARGHERITA\n• CARBONARA\n• TIRAMISU",
    align: "left",
    blockAlign: "center",
    vAlign: "middle",
  },
  {
    id: "agenda",
    label: "Agenda",
    text: "STANDUP 9AM\nREVIEW 11AM\nLUNCH 12PM\nDEMO 3PM",
    align: "left",
    blockAlign: "center",
    vAlign: "middle",
  },
  {
    id: "status",
    label: "Status",
    text: `${chip("green")} ALL SYSTEMS GO`,
    blockAlign: "center",
    vAlign: "middle",
  },
];

/** A preset as an activatable message, with unspecified positions defaulted. */
export function presetMessage(preset: Preset): ActiveMessage {
  return {
    text: preset.text,
    align: preset.align ?? "left",
    blockAlign: preset.blockAlign ?? "left",
    vAlign: preset.vAlign ?? "top",
  };
}

const RANDOM_GLYPHS = LETTERS + DIGITS;

/** A board-filling block of random glyphs, for the shuffle/test-animation tool. */
export function randomBoardText(rows: number, columns: number): string {
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let column = 0; column < columns; column++) {
      line += RANDOM_GLYPHS[Math.floor(Math.random() * RANDOM_GLYPHS.length)];
    }
    lines.push(line);
  }
  return lines.join("\n");
}
