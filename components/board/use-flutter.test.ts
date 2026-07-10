import { describe, expect, it } from "vitest";

import { isSingleTick } from "@/components/board/use-flutter";
import { BOARD_SIZES } from "@/lib/board";
import { layoutMessage } from "@/lib/layout";
import { renderProgram, type Program } from "@/lib/programs";

const CLOCK: Program = { kind: "clock", format: "12h" };

/** The flagship board a program shows at a given local time. */
function boardAt(hours: number, minutes: number, seconds = 0) {
  const now = new Date(2026, 6, 8, hours, minutes, seconds).getTime();
  return layoutMessage(renderProgram(CLOCK, now), BOARD_SIZES.flagship).board;
}

describe("isSingleTick", () => {
  it("classifies a plain minute tick as a single tick", () => {
    expect(isSingleTick(boardAt(8, 45), boardAt(8, 46))).toBe(true);
    expect(isSingleTick(boardAt(14, 41), boardAt(14, 42))).toBe(true);
  });

  it("classifies rollovers and reflows as full changes", () => {
    // 8:49 → 8:50: the 9 → 0 is a long way around the wheel.
    expect(isSingleTick(boardAt(8, 49), boardAt(8, 50))).toBe(false);
    // 12:59 → 1:00: the time line changes width, shifting every cell.
    expect(isSingleTick(boardAt(12, 59), boardAt(13, 0))).toBe(false);
  });

  it("treats an unchanged board and a countdown second tick correctly", () => {
    expect(isSingleTick(boardAt(8, 45), boardAt(8, 45))).toBe(true);
    const countdown: Program = { kind: "countdown", target: "2026-07-08T09:00" };
    const before = layoutMessage(
      renderProgram(countdown, new Date(2026, 6, 8, 8, 15, 15).getTime()),
      BOARD_SIZES.flagship,
    ).board;
    const after = layoutMessage(
      renderProgram(countdown, new Date(2026, 6, 8, 8, 15, 16).getTime()),
      BOARD_SIZES.flagship,
    ).board;
    // 44:45 → 44:44 — the last digit steps one flap back.
    expect(isSingleTick(before, after)).toBe(true);
  });
});
