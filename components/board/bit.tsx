import { memo, useEffect, useRef, useState } from "react";
import type { SlotOptions } from "slot-text";

import { ColorChipBit } from "@/components/board/color-chip-bit";
import { SlotTextBit } from "@/components/board/slot-text-bit";
import type { BoardTheme } from "@/lib/board";
import { colorChipForChar, isBlankBit } from "@/lib/cells";
import { isSupportedChar } from "@/lib/charset";
import { cn } from "@/lib/utils";

/** Theme-specific tile styling for the text/blank faces and the fold seam. */
const FACE: Record<BoardTheme, { tile: string; shadow: string; seam: string; chipRing: string }> = {
  light: {
    tile: "bg-[#e9e6dc] text-neutral-900",
    shadow:
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_3px_rgba(0,0,0,0.16),0_1px_2px_rgba(0,0,0,0.45)]",
    seam: "after:bg-black/15",
    chipRing: "ring-black/20",
  },
  dark: {
    tile: "bg-[#26262b] text-neutral-100",
    shadow:
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-2px_4px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.6)]",
    seam: "after:bg-white/10",
    chipRing: "ring-white/15",
  },
};

interface BitProps {
  /** Single character to display. A space (or blank bit) renders as a blank face. */
  value: string;
  /** Board-level stagger before this bit animates, in ms. */
  delay?: number;
  options?: SlotOptions;
  /** Swap instantly with no animation (reduced motion). */
  instant?: boolean;
  theme?: BoardTheme;
  className?: string;
}

/**
 * One board cell with fixed dimensions, so per-character animation can never
 * shift the surrounding layout. Text and blank faces roll via SlotText on a
 * themed tile (warm cream or dark gray); color chips fill the whole cell with
 * their color, keeping the same bevel and fold seam so they read as distinct.
 */
export const Bit = memo(function Bit({
  value,
  delay,
  options,
  instant,
  theme = "light",
  className,
}: BitProps) {
  const chip = colorChipForChar(value);
  const face = FACE[theme];

  // Retrigger the chip roll whenever the cell newly becomes (or switches) a
  // color chip, carrying the glyph it was showing so the roll continues from
  // there. Stays at 0 on first mount so existing chips don't roll in.
  const prevValue = useRef(value);
  const [chipFlip, setChipFlip] = useState<{ token: number; from: string }>({
    token: 0,
    from: " ",
  });
  useEffect(() => {
    const prev = prevValue.current;
    prevValue.current = value;
    if (prev !== value && chip) {
      setChipFlip((flip) => ({
        token: flip.token + 1,
        from: isSupportedChar(prev) ? prev : " ",
      }));
    }
  }, [value, chip]);

  return (
    <div
      aria-label={chip ? `${chip.label} chip` : undefined}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden",
        // Split-flap face with a beveled edge and a soft drop. Text tiles follow
        // the theme; color chips flap a color face over the same tile.
        "rounded-[3px]",
        face.shadow,
        chip ? cn("ring-1 ring-inset", face.chipRing, face.tile) : face.tile,
        // Hairline seam across the middle, evoking the flap fold.
        "after:pointer-events-none after:absolute after:inset-x-0 after:top-1/2 after:h-px after:-translate-y-1/2 after:content-['']",
        face.seam,
        "select-none font-mono uppercase leading-none",
        "text-[clamp(0.5rem,2.2vw,1.5rem)]",
        className,
      )}
    >
      {chip ? (
        <ColorChipBit
          key={chipFlip.token}
          color={chip.color}
          fromGlyph={chipFlip.from}
          delay={delay}
          options={options}
          instant={instant}
          flipToken={chipFlip.token}
        />
      ) : (
        <SlotTextBit
          value={isBlankBit(value) ? " " : value}
          delay={delay}
          options={options}
          instant={instant}
        />
      )}
    </div>
  );
});
