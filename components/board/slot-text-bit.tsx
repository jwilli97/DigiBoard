"use client";

import { useEffect, useRef, useState } from "react";
import type { SlotOptions } from "slot-text";
import { SlotText } from "slot-text/react";

import { SUPPORTED_CHARS } from "@/lib/charset";

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
export function SlotTextBit({ value, delay = 0, options, instant }: SlotTextBitProps) {
  const [shown, setShown] = useState(value);
  // Tracks what's currently on screen without retriggering the roll effect.
  const shownRef = useRef(value);

  useEffect(() => {
    if (instant || value === shownRef.current) return;

    const spins = FLAP_BASE_SPINS + Math.floor(Math.random() * FLAP_SPIN_VARIANCE);
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
