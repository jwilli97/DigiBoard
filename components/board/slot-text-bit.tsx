"use client";

import { useEffect, useRef, useState } from "react";
import type { SlotOptions } from "slot-text";
import { SlotText } from "slot-text/react";

import { SUPPORTED_CHARS, wheelDistance } from "@/lib/charset";

// Reduced-motion swap: zeroed timings make SlotText snap to the new glyph
// instantly instead of rolling.
const INSTANT_OPTIONS: SlotOptions = {
  duration: 0,
  stagger: 0,
  exitOffset: 0,
  colorFade: 0,
  bounce: 0,
};

/** The wheel of glyphs a flap rolls through, in canonical character order. */
const FLAP_ORDER = SUPPORTED_CHARS;

/** Base number of glyphs to flip through before landing, plus random variance. */
export const FLAP_BASE_SPINS = 10;
export const FLAP_SPIN_VARIANCE = 6;
/** Time between successive flaps, in ms. */
export const FLAP_INTERVAL = 90;

/**
 * Build the glyphs to roll through, stepping forward along the wheel from `from`
 * for `spins` frames and then landing exactly on `to`.
 */
function flapSequence(from: string, to: string, spins: number): string[] {
  const length = FLAP_ORDER.length;
  const start = Math.max(0, FLAP_ORDER.indexOf(from));

  const sequence: string[] = [];
  for (let step = 1; step <= spins; step++) {
    sequence.push(FLAP_ORDER[(start + step) % length]);
  }
  sequence.push(to);
  return sequence;
}

interface SlotTextBitProps {
  /** Single character to display (space for a blank face). */
  value: string;
  /** Glyph to start from on mount, rolling to `value` — used when a cell that
   * was showing a color chip becomes text again. Omitted, the bit mounts
   * already showing `value`. */
  fromGlyph?: string;
  /** Board-level stagger before this bit starts rolling, in ms. */
  delay?: number;
  options?: SlotOptions;
  /** Swap instantly with no animation (reduced motion). */
  instant?: boolean;
}

/**
 * A single board character rendered with SlotText. When its value changes it
 * rolls through several intermediate glyphs — like a real split-flap cell —
 * before settling on the target. Unchanged cells stay perfectly still, and the
 * fixed cell size means the roll never shifts the layout.
 */
export function SlotTextBit({ value, fromGlyph, delay = 0, options, instant }: SlotTextBitProps) {
  // Mounting with fromGlyph ≠ value leaves the roll effect below to bridge the
  // gap, so a remounted cell (chip → text) rolls in like any other change.
  const [shown, setShown] = useState(fromGlyph ?? value);
  // Tracks what's currently on screen without retriggering the roll effect.
  const shownRef = useRef(fromGlyph ?? value);

  useEffect(() => {
    if (instant || value === shownRef.current) return;

    // Adjacent glyphs — a clock minute ticking 5 → 6, a countdown second
    // dropping 4 → 3 — advance with a single flap, like a real wheel would.
    // Anything farther away gets the full theatrical roll.
    const spins =
      wheelDistance(shownRef.current, value) === 1
        ? 0
        : FLAP_BASE_SPINS + Math.floor(Math.random() * FLAP_SPIN_VARIANCE);
    const sequence = flapSequence(shownRef.current, value, spins);

    let cancelled = false;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      shownRef.current = sequence[step];
      setShown(sequence[step]);
      step += 1;
      if (step < sequence.length) timer = setTimeout(tick, FLAP_INTERVAL);
    };

    // The board-level stagger applies before the first flap.
    timer = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, delay, instant]);

  return (
    <SlotText
      text={instant ? value : shown}
      options={instant ? INSTANT_OPTIONS : options}
      className="font-mono leading-none"
    />
  );
}
