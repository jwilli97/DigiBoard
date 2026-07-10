"use client";

import { memo, useMemo } from "react";
import type { SlotOptions } from "slot-text";

import { Bit } from "@/components/board/bit";
import { usePrefersReducedMotion } from "@/components/board/use-prefers-reduced-motion";
import { boardToText, cellIndex, type BoardState, type BoardTheme } from "@/lib/board";
import { colorChipForChar, isBlankBit } from "@/lib/cells";
import { cn } from "@/lib/utils";

export interface BoardAnimation {
  /** Per-bit SlotText roll options (direction, duration, color, …). */
  options?: SlotOptions;
  /** Milliseconds added per diagonal step, producing the roll-in sweep. */
  staggerStep?: number;
}

// Glyph size tracks the board's own width (cqw), not the viewport, so the
// board still renders correctly when it's sized by height (e.g. /present on a
// wide screen). Scaled per column count to keep a glyph ≈60% of a cell.
const FONT_SCALE = 59;

/** Default ms per diagonal step — also used to time the click sound (useFlutter). */
export const DEFAULT_STAGGER_STEP = 18;

const DEFAULT_ANIMATION: Required<BoardAnimation> = {
  options: {
    direction: "down",
    // Each individual flap is a quick slide — overall flip length comes from
    // rolling through many glyphs (see SlotTextBit), like a real split-flap.
    duration: 150,
    exitOffset: 36,
    bounce: 0.35,
  },
  staggerStep: DEFAULT_STAGGER_STEP,
};

/** Map a cell to assistive-tech text (naming color chips, blanking fillers). */
function describeCell(cell: string): string {
  const chip = colorChipForChar(cell);
  if (chip) return ` ${chip.label} chip `;
  if (isBlankBit(cell)) return " ";
  return cell;
}

interface BoardProps {
  state: BoardState;
  animation?: BoardAnimation;
  theme?: BoardTheme;
  className?: string;
}

/**
 * Renders the board as a fixed grid of cells inside a matte frame. Changed bits
 * roll into place with a gentle diagonal stagger; the grid dimensions come
 * entirely from board state, so the surface stays stable no matter what shows.
 *
 * Memoized so composing (which re-renders the page on every keystroke) doesn't
 * reconcile all the cells unless the displayed board actually changes.
 */
export const Board = memo(function Board({
  state,
  animation,
  theme = "light",
  className,
}: BoardProps) {
  const { rows, columns, cells } = state;
  const reducedMotion = usePrefersReducedMotion();

  const options = animation?.options ?? DEFAULT_ANIMATION.options;
  const staggerStep = animation?.staggerStep ?? DEFAULT_ANIMATION.staggerStep;

  const description = useMemo(() => boardToText(state, describeCell), [state]);

  return (
    <div
      className={cn(
        // Matte black frame with a faint top bevel highlight and a deep drop.
        // Also the size container that cell glyphs scale against.
        "@container rounded-2xl bg-neutral-950 p-2.5 ring-1 ring-white/5 sm:p-4",
        "shadow-[0_25px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {/* Accessible reading of the board; announced when the message changes. */}
      <p className="sr-only" role="status" aria-live="polite">
        {description ? `Board message: ${description}` : "Board is blank"}
      </p>
      <div
        aria-hidden="true"
        className={cn(
          // Recessed well that the tiles sit inside.
          "grid gap-[3px] rounded-lg bg-black/60 p-1.5 sm:gap-1 sm:p-2",
          "shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)]",
        )}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          fontSize: `${(FONT_SCALE / columns).toFixed(2)}cqw`,
        }}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: columns }, (_, column) => {
            const index = cellIndex(row, column, columns);
            return (
              <Bit
                key={index}
                value={cells[index]}
                delay={(row + column) * staggerStep}
                options={options}
                instant={reducedMotion}
                theme={theme}
              />
            );
          }),
        )}
      </div>
    </div>
  );
});