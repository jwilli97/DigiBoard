"use client";

import { useEffect, useMemo, useState } from "react";

import type { ActiveMessage } from "@/lib/layout";
import { nextTickAt, renderProgram, type Program } from "@/lib/programs";

const BLANK_MESSAGE: ActiveMessage = { text: "", align: "left", blockAlign: "left", vAlign: "top" };

/**
 * The message a program is currently showing, re-evaluated at each moment its
 * output can change (per minute for clocks, per second for countdowns, per
 * slide for rotations). Time-based programs render blank until mounted so the
 * server and client's first renders agree; the board then rolls the content in.
 */
export function useProgramMessage(program: Program): ActiveMessage {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      const next = nextTickAt(program, current);
      if (next !== null) timer = setTimeout(tick, Math.max(next - current, 20));
    };

    // Timers lag while a tab is hidden or the machine sleeps; realign as soon
    // as the sign is visible again.
    const realign = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      tick();
    };

    tick();
    document.addEventListener("visibilitychange", realign);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", realign);
    };
  }, [program]);

  return useMemo(() => {
    if (now === null) return program.kind === "message" ? program.message : BLANK_MESSAGE;
    return renderProgram(program, now);
  }, [program, now]);
}
