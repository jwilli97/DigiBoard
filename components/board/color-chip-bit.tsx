"use client";

import { useEffect, useState } from "react";
import type { SlotOptions } from "slot-text";
import { SlotText } from "slot-text/react";

import {
  FLAP_BASE_SPINS,
  FLAP_INTERVAL,
  FLAP_SPIN_VARIANCE,
} from "@/components/board/slot-text-bit";
import { SUPPORTED_CHARS } from "@/lib/charset";

/** The same wheel of glyphs a text flap rolls through. */
const FLAP_ORDER = SUPPORTED_CHARS;

interface ColorChipBitProps {
  /** CSS color painted on the chip face once it lands. */
  color: string;
  /** Glyph the cell was showing before it became a chip, so the roll continues
   * from there instead of jumping. */
  fromGlyph?: string;
  /** Board-level stagger before this chip starts rolling, in ms. */
  delay?: number;
  /** Per-character SlotText roll options, shared with the text bits. */
  options?: SlotOptions;
  /** Swap instantly with no animation (reduced motion). */
  instant?: boolean;
  /**
   * Changes whenever the cell newly becomes (or switches) a color chip, which
   * retriggers the roll. Stays at 0 on first mount so existing chips don't roll.
   */
  flipToken: number;
}

/**
 * A color chip that rolls into place with the exact same split-flap motion as a
 * letter: it spins through real glyphs via SlotText (same wheel, same cadence)
 * and then, instead of landing on a glyph, the color slides down over the final
 * frame like the last flap dropping — so it reads identically to the text bits.
 */
export function ColorChipBit({
  color,
  fromGlyph = " ",
  delay = 0,
  options,
  instant,
  flipToken,
}: ColorChipBitProps) {
  // This component is remounted (keyed on the flip token) for each activation,
  // so initial state covers every case without resetting inside the effect:
  // a fresh roll starts with the color lifted off the glyph; first mount and
  // reduced motion start already settled on the color.
  const settled = instant || flipToken === 0;
  const [glyph, setGlyph] = useState(fromGlyph);
  const [landed, setLanded] = useState(settled);

  useEffect(() => {
    if (settled) return;

    const spins = FLAP_BASE_SPINS + Math.floor(Math.random() * FLAP_SPIN_VARIANCE);
    const length = FLAP_ORDER.length;
    const start = Math.max(0, FLAP_ORDER.indexOf(fromGlyph));

    let cancelled = false;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      if (step < spins) {
        // Step forward along the wheel, exactly like a text flap.
        setGlyph(FLAP_ORDER[(start + step + 1) % length]);
        step += 1;
        timer = setTimeout(tick, FLAP_INTERVAL);
      } else {
        // The color is the final flap: drop it over the last glyph.
        setLanded(true);
      }
    };

    // The board-level stagger applies before the first flap.
    timer = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [settled, delay, fromGlyph]);

  return (
    <>
      {/* Rolling glyphs — the same SlotText slide the text bits use. */}
      <SlotText
        text={glyph}
        options={instant ? undefined : options}
        className="font-mono leading-none"
      />
      {/* The color drops in as the final flap, sliding down from the top edge to
          match the "down" roll direction; clipped by the cell's overflow. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-transform ease-out"
        style={{
          backgroundColor: color,
          transitionDuration: instant ? "0ms" : `${options?.duration ?? 150}ms`,
          transform: landed ? "translateY(0)" : "translateY(-101%)",
        }}
      />
    </>
  );
}
