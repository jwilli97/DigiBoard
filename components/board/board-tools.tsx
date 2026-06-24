"use client";

import {
  Check,
  Clock,
  Copy,
  Dices,
  Moon,
  Shuffle,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BoardTheme } from "@/lib/board";
import { isSpecialBit } from "@/lib/cells";
import type { ActiveMessage } from "@/lib/layout";
import { PRESETS, type Preset } from "@/lib/presets";

interface BoardToolsProps {
  onLoadPreset: (preset: Preset) => void;
  onRandom: () => void;
  onShuffle: () => void;
  onCopyJson: () => Promise<boolean>;
  theme: BoardTheme;
  onToggleTheme: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  history: ActiveMessage[];
  onLoadHistory: (item: ActiveMessage) => void;
  onClearHistory: () => void;
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

export function BoardTools({
  onLoadPreset,
  onRandom,
  onShuffle,
  onCopyJson,
  theme,
  onToggleTheme,
  soundOn,
  onToggleSound,
  history,
  onLoadHistory,
  onClearHistory,
}: BoardToolsProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function handleCopy() {
    const ok = await onCopyJson();
    if (!ok) return;
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex w-full flex-col gap-3">
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

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onRandom}
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Dices />
          Random
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onShuffle}
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Shuffle />
          Shuffle
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={theme === "light" ? "Switch to dark board" : "Switch to light board"}
            aria-pressed={theme === "dark"}
            onClick={onToggleTheme}
            className="text-white/70 hover:bg-white/10 hover:text-white"
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
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            {soundOn ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy JSON"}
          </Button>
        </div>
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
