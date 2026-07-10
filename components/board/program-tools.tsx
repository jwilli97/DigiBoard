"use client";

import { CalendarClock, Clock3, RotateCw, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRESETS, presetMessage } from "@/lib/presets";
import type { Program } from "@/lib/programs";

/** How long each slide of the preset rotation holds. */
const ROTATION_SECONDS = 10;

const GHOST = "text-white/70 hover:bg-white/10 hover:text-white";
const FIELD =
  "h-8 rounded-md border-white/15 bg-white/5 px-2 text-sm text-white placeholder:text-white/30 [color-scheme:dark]";

const LIVE_LABEL: Record<Exclude<Program["kind"], "message">, string> = {
  clock: "Clock",
  countdown: "Countdown",
  rotation: "Preset rotation",
};

interface ProgramToolsProps {
  /** The active program; the "message" kind means nothing live is running. */
  program: Program;
  onActivate: (program: Program) => void;
  /** Stop the live program, freezing the board on what it currently shows. */
  onStop: () => void;
}

/**
 * Launcher for live programs — clock, countdown, preset rotation — plus a
 * status chip while one is running. Activating a regular message from the
 * composer also stops whatever program is live.
 */
export function ProgramTools({ program, onActivate, onStop }: ProgramToolsProps) {
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");

  function startCountdown() {
    if (!target) return;
    onActivate({ kind: "countdown", target, label: label.trim() || undefined });
    setCountdownOpen(false);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs tracking-wide text-white/40 uppercase">Programs</span>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={GHOST}
          onClick={() => onActivate({ kind: "clock", format: "12h" })}
        >
          <Clock3 />
          Clock
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={GHOST}
          aria-expanded={countdownOpen}
          onClick={() => setCountdownOpen(!countdownOpen)}
        >
          <CalendarClock />
          Countdown
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={GHOST}
          onClick={() =>
            onActivate({
              kind: "rotation",
              messages: PRESETS.map(presetMessage),
              intervalSeconds: ROTATION_SECONDS,
            })
          }
        >
          <RotateCw />
          Rotate presets
        </Button>

        {program.kind !== "message" && (
          <span className="ml-auto flex items-center gap-2 text-xs text-white/60">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            {LIVE_LABEL[program.kind]}
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Stop program"
              onClick={onStop}
              className="text-white/40 hover:bg-white/10 hover:text-white"
            >
              <Square />
            </Button>
          </span>
        )}
      </div>

      {countdownOpen && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            startCountdown();
          }}
        >
          <Input
            type="datetime-local"
            aria-label="Count down to"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className={`${FIELD} w-auto`}
          />
          <Input
            aria-label="Countdown label"
            placeholder="LABEL (OPTIONAL)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className={`${FIELD} w-44 font-mono uppercase`}
          />
          <Button type="submit" size="sm" variant="ghost" disabled={!target} className={GHOST}>
            Start
          </Button>
        </form>
      )}
    </div>
  );
}
