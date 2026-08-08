// Programs are live board content: pure functions of time that produce the
// message the board should show. Displays tick them locally at each moment the
// output can change (see useProgramMessage), so multiple tabs stay in step
// without exchanging any per-tick state.

import { COLOR_CHIPS } from "@/lib/cells";
import { DEFAULT_MESSAGE, type ActiveMessage } from "@/lib/layout";

export type Program =
  /** A static message — what activating from the composer produces. */
  | { kind: "message"; message: ActiveMessage }
  | { kind: "clock"; format: "12h" | "24h" }
  /** Counts down to `target` (a datetime-local string, parsed as local time). */
  | { kind: "countdown"; target: string; label?: string }
  | { kind: "rotation"; messages: ActiveMessage[]; intervalSeconds: number }
  /**
   * Preloaded scenes stepped manually (arrow keys in presentation mode) and/or
   * on a timer. Unlike rotation's epoch grid, position is anchored: the scene
   * at `index` shows at `advancedAt`, and auto-advance (when `intervalSeconds`
   * is set) derives from time elapsed since that anchor. Manual steps write a
   * re-anchored program, so rendering stays a pure function of (program, now)
   * and every tab shows the same scene.
   */
  | {
      kind: "sequence";
      scenes: ActiveMessage[];
      index: number;
      advancedAt: number;
      intervalSeconds?: number;
    };

/** A sequence program's kind narrowed out, for step/render helpers. */
export type SequenceProgram = Extract<Program, { kind: "sequence" }>;

export const DEFAULT_PROGRAM: Program = { kind: "message", message: DEFAULT_MESSAGE };

const CENTERED = { align: "center", blockAlign: "center", vAlign: "middle" } as const;

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function clockMessage(format: "12h" | "24h", now: number): ActiveMessage {
  const date = new Date(now);
  const dateLine = `${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
  const hours = date.getHours();
  const time =
    format === "24h"
      ? `${pad(hours)}:${pad(date.getMinutes())}`
      : `${hours % 12 || 12}:${pad(date.getMinutes())} ${hours < 12 ? "AM" : "PM"}`;
  return { text: `${dateLine}\n${time}`, ...CENTERED };
}

/**
 * Remaining time as board text: calm day/hour/minute parts above an hour,
 * then second-by-second flapping for the final stretch.
 */
function formatRemaining(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return [...(days > 0 ? [`${days}D`] : []), `${hours}H`, `${minutes}M`].join(" ");
  }
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

function countdownMessage(target: string, label: string | undefined, now: number): ActiveMessage {
  const targetMs = Date.parse(target);
  // Ceil so the display reads 00:01 up until the target and flips to the
  // finale exactly on it. An unparseable target lands on the finale too.
  const remaining = Math.ceil((targetMs - now) / 1000);

  if (!Number.isFinite(targetMs) || remaining <= 0) {
    const chips = COLOR_CHIPS.map((chip) => chip.char).join("");
    return { text: `${chips}\n${label || "TIME'S UP"}\n${chips}`, ...CENTERED };
  }

  const lines = label ? [label, formatRemaining(remaining)] : [formatRemaining(remaining)];
  return { text: lines.join("\n"), ...CENTERED };
}

function rotationMessage(
  messages: ActiveMessage[],
  intervalSeconds: number,
  now: number,
): ActiveMessage {
  if (messages.length === 0) return { text: "", ...CENTERED };
  // Indexed on the epoch grid rather than activation time, so every tab shows
  // the same slide at the same moment without exchanging state.
  const interval = Math.max(1, intervalSeconds) * 1000;
  return messages[Math.floor(now / interval) % messages.length];
}

/** Euclidean modulo, so stepping backwards from scene 0 wraps to the end. */
function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}

/** The scene a sequence shows at instant `now`. */
export function sequenceIndex(program: SequenceProgram, now: number): number {
  if (program.scenes.length === 0) return 0;
  // Clamp elapsed at 0 so a tab whose clock trails the anchor (or a re-anchor
  // racing a render) never computes a negative position.
  const elapsed =
    program.intervalSeconds === undefined
      ? 0
      : Math.floor(Math.max(0, now - program.advancedAt) / (Math.max(1, program.intervalSeconds) * 1000));
  return wrap(program.index + elapsed, program.scenes.length);
}

/**
 * The sequence re-anchored one scene forward or back from what it currently
 * shows. Anchoring at `now` also restarts the auto-advance hold, so a manual
 * step always displays for a full interval.
 */
export function stepSequence(program: SequenceProgram, direction: 1 | -1, now: number): SequenceProgram {
  if (program.scenes.length === 0) return program;
  return {
    ...program,
    index: wrap(sequenceIndex(program, now) + direction, program.scenes.length),
    advancedAt: now,
  };
}

/** The message a program shows at instant `now` (ms since epoch). */
export function renderProgram(program: Program, now: number): ActiveMessage {
  switch (program.kind) {
    case "message":
      return program.message;
    case "clock":
      return clockMessage(program.format, now);
    case "countdown":
      return countdownMessage(program.target, program.label, now);
    case "rotation":
      return rotationMessage(program.messages, program.intervalSeconds, now);
    case "sequence":
      if (program.scenes.length === 0) return { text: "", ...CENTERED };
      return program.scenes[sequenceIndex(program, now)];
  }
}

/** The next multiple of `step` strictly after `now`. */
function boundary(now: number, step: number): number {
  return (Math.floor(now / step) + 1) * step;
}

/**
 * Absolute time (ms) at which the program's output can next change, or null
 * when it never will — static messages, finished countdowns, single-slide
 * rotations.
 */
export function nextTickAt(program: Program, now: number): number | null {
  switch (program.kind) {
    case "message":
      return null;
    case "clock":
      return boundary(now, 60_000);
    case "countdown": {
      const target = Date.parse(program.target);
      if (!Number.isFinite(target) || now >= target) return null;
      return boundary(now, 1000);
    }
    case "rotation":
      if (program.messages.length <= 1) return null;
      return boundary(now, Math.max(1, program.intervalSeconds) * 1000);
    case "sequence": {
      if (program.intervalSeconds === undefined || program.scenes.length <= 1) return null;
      // Boundaries are anchored at advancedAt rather than the epoch, so a
      // manual step holds for a full interval before auto-advance resumes.
      const step = Math.max(1, program.intervalSeconds) * 1000;
      return program.advancedAt + boundary(Math.max(0, now - program.advancedAt), step);
    }
  }
}
