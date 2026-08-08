"use client";

import {
  CalendarClock,
  Check,
  Clock,
  Clock3,
  Copy,
  Dices,
  ListVideo,
  Moon,
  Play,
  Plus,
  Presentation,
  RotateCw,
  Shuffle,
  Square,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { SegmentedControl, type SegmentOption } from "@/components/board/segmented-control";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOARD_SIZES, type BoardSizeKey, type BoardTheme } from "@/lib/board";
import { isSpecialBit } from "@/lib/cells";
import type { ActiveMessage } from "@/lib/layout";
import { PRESETS, presetMessage, type Preset } from "@/lib/presets";
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
  sequence: "Sequence",
};

const SIZE_OPTIONS: SegmentOption<BoardSizeKey>[] = [
  { value: "flagship", label: BOARD_SIZES.flagship.label },
  { value: "note", label: BOARD_SIZES.note.label },
];

interface BoardToolsProps {
  onLoadPreset: (preset: Preset) => void;
  onRandom: () => void;
  onShuffle: () => void;
  onCopyJson: () => Promise<boolean>;
  /** Selected board format. */
  sizeKey: BoardSizeKey;
  onSizeChange: (value: BoardSizeKey) => void;
  theme: BoardTheme;
  onToggleTheme: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  history: ActiveMessage[];
  onLoadHistory: (item: ActiveMessage) => void;
  onClearHistory: () => void;
  /** The active program; the "message" kind means nothing live is running. */
  program: Program;
  onActivateProgram: (program: Program) => void;
  /** Stop the live program, freezing the board on what it currently shows. */
  onStopProgram: () => void;
  /** Saved sequence scenes, persisted so they survive reloads and replays. */
  scenes: ActiveMessage[];
  /** Capture the composer's current draft as a new scene. */
  onAddScene: () => void;
  canAddScene: boolean;
  onRemoveScene: (index: number) => void;
}

/** Readable one-line label for a stored message (special bits become a box). */
function previewLabel(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const cleaned = [...firstLine]
    .map((char) => (isSpecialBit(char) ? "□" : char))
    .join("")
    .trim();
  return cleaned.length > 22 ? `${cleaned.slice(0, 22)}…` : cleaned || "□";
}

/**
 * Everything quieter than composing: the message library (presets, random,
 * shuffle), live programs (clock, countdown, rotation), board settings (size,
 * theme, sound), utilities, and history. Grouped into two calm rows so the
 * composer above keeps the visual focus.
 */
export function BoardTools({
  onLoadPreset,
  onRandom,
  onShuffle,
  onCopyJson,
  sizeKey,
  onSizeChange,
  theme,
  onToggleTheme,
  soundOn,
  onToggleSound,
  history,
  onLoadHistory,
  onClearHistory,
  program,
  onActivateProgram,
  onStopProgram,
  scenes,
  onAddScene,
  canAddScene,
  onRemoveScene,
}: BoardToolsProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [countdownOpen, setCountdownOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");

  const [sequenceOpen, setSequenceOpen] = useState(false);
  /** Per-scene hold as entered; blank means manual (arrow-key) stepping only. */
  const [holdSeconds, setHoldSeconds] = useState("");

  async function handleCopy() {
    const ok = await onCopyJson();
    if (!ok) return;
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  function startCountdown() {
    if (!target) return;
    onActivateProgram({ kind: "countdown", target, label: label.trim() || undefined });
    setCountdownOpen(false);
  }

  function playSequence() {
    if (scenes.length === 0) return;
    const seconds = Number.parseInt(holdSeconds, 10);
    onActivateProgram({
      kind: "sequence",
      scenes,
      index: 0,
      advancedAt: Date.now(),
      intervalSeconds: Number.isFinite(seconds) && seconds > 0 ? seconds : undefined,
    });
  }

  return (
    <div className="flex w-full flex-col gap-3 border-t border-white/10 pt-4">
      {/* Library and live programs */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Load a preset"
          value=""
          onChange={(event) => {
            const preset = PRESETS.find((p) => p.id === event.target.value);
            if (preset) onLoadPreset(preset);
            event.target.value = "";
          }}
          className="h-8 rounded-md border border-white/15 bg-white/5 px-2 text-sm text-white outline-none focus-visible:border-white/40"
        >
          <option value="" disabled>
            Presets…
          </option>
          {PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id} className="bg-neutral-900">
              {preset.label}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="ghost" onClick={onRandom} className={GHOST}>
          <Dices />
          Random
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onShuffle} className={GHOST}>
          <Shuffle />
          Shuffle
        </Button>

        <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/15" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={GHOST}
          onClick={() => onActivateProgram({ kind: "clock", format: "12h" })}
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
            onActivateProgram({
              kind: "rotation",
              messages: PRESETS.map(presetMessage),
              intervalSeconds: ROTATION_SECONDS,
            })
          }
        >
          <RotateCw />
          Rotate presets
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={GHOST}
          aria-expanded={sequenceOpen}
          onClick={() => setSequenceOpen(!sequenceOpen)}
        >
          <ListVideo />
          Sequence
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
              onClick={onStopProgram}
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

      {sequenceOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onAddScene}
            disabled={!canAddScene}
            className={GHOST}
          >
            <Plus />
            Add scene
          </Button>
          {scenes.map((scene, index) => (
            <span
              key={`${scene.text}-${index}`}
              title={scene.text}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-0.5 pr-0.5 pl-2.5 font-mono text-xs text-white/70"
            >
              <span className="max-w-[10rem] truncate">
                {index + 1} {previewLabel(scene.text)}
              </span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={`Remove scene ${index + 1}`}
                onClick={() => onRemoveScene(index)}
                className="text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X />
              </Button>
            </span>
          ))}
          {scenes.length > 0 && (
            <>
              <Input
                type="number"
                min={1}
                aria-label="Seconds per scene (blank for manual stepping)"
                placeholder="MANUAL"
                value={holdSeconds}
                onChange={(event) => setHoldSeconds(event.target.value)}
                className={`${FIELD} w-24 font-mono`}
              />
              <Button type="button" size="sm" variant="ghost" onClick={playSequence} className={GHOST}>
                <Play />
                Play
              </Button>
              <span className="text-xs text-white/40">
                Blank hold time steps with ← → in Present
              </span>
            </>
          )}
        </div>
      )}

      {/* Board settings and utilities */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <SegmentedControl
          label="Size"
          value={sizeKey}
          onChange={onSizeChange}
          options={SIZE_OPTIONS}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={theme === "light" ? "Switch to dark board" : "Switch to light board"}
          aria-pressed={theme === "dark"}
          onClick={onToggleTheme}
          className={GHOST}
        >
          {theme === "light" ? <Moon /> : <Sun />}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={soundOn ? "Mute sound" : "Enable sound"}
          aria-pressed={soundOn}
          onClick={onToggleSound}
          className={GHOST}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={handleCopy} className={GHOST}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy JSON"}
        </Button>

        <Link
          href="/present"
          className={buttonVariants({
            size: "sm",
            variant: "ghost",
            className: `ml-auto ${GHOST}`,
          })}
        >
          <Presentation />
          Present
        </Link>
      </div>

      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Clock className="size-3.5 text-white/40" />
          {history.map((item, index) => (
            <button
              key={`${item.text}-${index}`}
              type="button"
              onClick={() => onLoadHistory(item)}
              title={item.text}
              className="max-w-[12rem] truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              {previewLabel(item.text)}
            </button>
          ))}
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Clear history"
            onClick={onClearHistory}
            className="text-white/40 hover:bg-white/10 hover:text-white"
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </div>
  );
}
