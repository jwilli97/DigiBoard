"use client";

import { useEffect, useRef } from "react";

import { DEFAULT_STAGGER_STEP } from "@/components/board/board";
import { boardsEqual, type BoardState } from "@/lib/board";
import { wheelDistance } from "@/lib/charset";
import { playClick, playFlutter, unlockSound } from "@/lib/sound";

/**
 * True when every cell that changed is exactly one wheel step away — the whole
 * change is single flaps (a clock minute ticking over), not rolls.
 */
export function isSingleTick(prev: BoardState, next: BoardState): boolean {
  if (prev.rows !== next.rows || prev.columns !== next.columns) return false;
  return prev.cells.every(
    (cell, index) => cell === next.cells[index] || wheelDistance(cell, next.cells[index]) === 1,
  );
}

/**
 * Stagger delay (ms) before the earliest changed cell starts flapping, matching
 * the diagonal sweep the Board applies — so a click sounds when its flap moves.
 */
function firstChangeDelay(prev: BoardState, next: BoardState): number {
  let earliest = Number.POSITIVE_INFINITY;
  next.cells.forEach((cell, index) => {
    if (cell === prev.cells[index]) return;
    earliest = Math.min(earliest, Math.floor(index / next.columns) + (index % next.columns));
  });
  return Number.isFinite(earliest) ? earliest * DEFAULT_STAGGER_STEP : 0;
}

/**
 * Play the mechanical sound whenever the board's flaps actually move — whether
 * from a local activation, another tab, or a program tick. Changes made
 * entirely of adjacent-glyph ticks get a single click, matching their
 * single-flap animation; anything bigger gets the full flutter. The first
 * board seen while `active` seeds the comparison, so mounting is silent —
 * pass `active: false` while the board isn't displayed yet (e.g. /present
 * before hydration) so pre-display boards can't trigger phantom sounds.
 */
export function useFlutter(board: BoardState, enabled: boolean, active = true) {
  const prev = useRef<BoardState | null>(null);

  useEffect(() => {
    unlockSound();
  }, []);

  useEffect(() => {
    if (!active) return;
    const previous = prev.current;
    prev.current = board;
    if (previous === null) return;
    // Hidden tabs stay silent: browsers throttle their timers, so a background
    // clock jumps several minutes at once and would play a phantom flutter —
    // and with a composer and a /present tab open, every change would sound
    // twice.
    if (!enabled || document.hidden || boardsEqual(previous, board)) return;
    if (isSingleTick(previous, board)) {
      playClick(firstChangeDelay(previous, board));
      return;
    }
    playFlutter();
  }, [board, enabled, active]);
}
