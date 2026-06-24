"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Eraser,
  FoldVertical,
  Send,
  Square,
} from "lucide-react";
import { useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BOARD_SIZES, type BoardSizeKey } from "@/lib/board";
import { BLANK_BIT, COLOR_CHIPS, SYMBOL_BITS } from "@/lib/cells";
import type { HorizontalAlign, LayoutResult, VerticalAlign } from "@/lib/layout";
import { cn } from "@/lib/utils";

interface ComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  /** Alignment of each line within the text block. */
  align: HorizontalAlign;
  onAlignChange: (value: HorizontalAlign) => void;
  /** Horizontal position of the text block on the board. */
  blockAlign: HorizontalAlign;
  onBlockAlignChange: (value: HorizontalAlign) => void;
  /** Vertical position of the text block on the board. */
  vAlign: VerticalAlign;
  onVAlignChange: (value: VerticalAlign) => void;
  /** Selected board format. */
  sizeKey: BoardSizeKey;
  onSizeChange: (value: BoardSizeKey) => void;
  onActivate: () => void;
  onClear: () => void;
  canActivate: boolean;
  layout: LayoutResult;
}

type Icon = typeof AlignLeft;

interface SegmentOption<T extends string> {
  value: T;
  /** Icon shown for the segment; falls back to `label` text when omitted. */
  icon?: Icon;
  label: string;
}

const H_ALIGN_OPTIONS: SegmentOption<HorizontalAlign>[] = [
  { value: "left", icon: AlignLeft, label: "left" },
  { value: "center", icon: AlignCenter, label: "center" },
  { value: "right", icon: AlignRight, label: "right" },
];

const V_ALIGN_OPTIONS: SegmentOption<VerticalAlign>[] = [
  { value: "top", icon: ArrowUpToLine, label: "top" },
  { value: "middle", icon: FoldVertical, label: "middle" },
  { value: "bottom", icon: ArrowDownToLine, label: "bottom" },
];

const SIZE_OPTIONS: SegmentOption<BoardSizeKey>[] = [
  { value: "flagship", label: BOARD_SIZES.flagship.label },
  { value: "note", label: BOARD_SIZES.note.label },
];

function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-white/40">{label}</span>
      <div className="flex items-center gap-0.5 rounded-md border border-white/15 bg-white/5 p-0.5">
        {options.map(({ value: optionValue, icon: OptionIcon, label: optionLabel }) => (
          <Button
            key={optionValue}
            type="button"
            size={OptionIcon ? "icon-sm" : "sm"}
            variant="ghost"
            aria-label={`${label} ${optionLabel}`}
            aria-pressed={value === optionValue}
            onClick={() => onChange(optionValue)}
            className={cn(
              "text-white/60 hover:bg-white/10 hover:text-white",
              !OptionIcon && "font-mono text-xs",
              value === optionValue && "bg-white/15 text-white",
            )}
          >
            {OptionIcon ? <OptionIcon /> : optionLabel}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Drafting controls for the board. Typing only updates local draft state — the
 * board is not touched until Activate is pressed (or Enter on a single line).
 */
export function Composer({
  draft,
  onDraftChange,
  align,
  onAlignChange,
  blockAlign,
  onBlockAlignChange,
  vAlign,
  onVAlignChange,
  sizeKey,
  onSizeChange,
  onActivate,
  onClear,
  canActivate,
  layout,
}: ComposerProps) {
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSingleLine = !draft.includes("\n");

  // Insert a bit at the caret (or replacing the current selection), then restore
  // focus and place the caret just after the inserted bit.
  function insertBit(char: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    onDraftChange(draft.slice(0, start) + char + draft.slice(end));

    requestAnimationFrame(() => {
      if (!el) return;
      const caret = start + char.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (canActivate) onActivate();
      }}
    >
      <Label htmlFor={textareaId} className="sr-only">
        Message
      </Label>
      <textarea
        ref={textareaRef}
        id={textareaId}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          // Enter activates a single-line draft; multi-line drafts keep Enter
          // as a newline. Shift+Enter always inserts a newline.
          if (event.key === "Enter" && !event.shiftKey && isSingleLine) {
            event.preventDefault();
            if (canActivate) onActivate();
          }
        }}
        rows={3}
        placeholder="Type a message for the board…"
        className="w-full resize-none rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm uppercase text-white outline-none placeholder:text-white/40 placeholder:normal-case focus-visible:border-white/40 focus-visible:ring-3 focus-visible:ring-white/10"
      />

      {/* Special-bit picker: insert at the caret */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-white/40">Insert</span>
        <div className="flex items-center gap-1">
          {COLOR_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-label={`Insert ${chip.label} chip`}
              title={chip.label}
              onClick={() => insertBit(chip.char)}
              className="size-5 rounded-[3px] ring-1 ring-white/15 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
              style={{ backgroundColor: chip.color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {SYMBOL_BITS.map((symbol) => (
            <Button
              key={symbol.id}
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Insert ${symbol.label}`}
              title={symbol.label}
              onClick={() => insertBit(symbol.char)}
              className="font-mono text-white/70 hover:bg-white/10 hover:text-white"
            >
              {symbol.char}
            </Button>
          ))}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Insert blank bit"
            title="Blank bit"
            onClick={() => insertBit(BLANK_BIT)}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Square />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SegmentedControl
            label="Lines"
            value={align}
            onChange={onAlignChange}
            options={H_ALIGN_OPTIONS}
          />
          <SegmentedControl
            label="Block"
            value={blockAlign}
            onChange={onBlockAlignChange}
            options={H_ALIGN_OPTIONS}
          />
          <SegmentedControl
            label="Vertical"
            value={vAlign}
            onChange={onVAlignChange}
            options={V_ALIGN_OPTIONS}
          />
          <SegmentedControl
            label="Size"
            value={sizeKey}
            onChange={onSizeChange}
            options={SIZE_OPTIONS}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={draft.length === 0}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Eraser />
            Clear
          </Button>
          <Button
            type="submit"
            disabled={!canActivate}
            className="bg-white text-black hover:bg-white/85"
          >
            <Send />
            Activate
          </Button>
        </div>
      </div>

      <div className="flex min-h-[1.25rem] flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {layout.overflow && (
            <span className="text-amber-400">Message too long — extra rows were cut.</span>
          )}
          {layout.unsupported.length > 0 && (
            <span className="text-amber-400">
              Dropped unsupported: {layout.unsupported.map((c) => JSON.stringify(c)).join(" ")}
            </span>
          )}
        </div>
        <span className="text-white/45 tabular-nums">
          {layout.usedCells}/{layout.totalCells} cells
        </span>
      </div>
    </form>
  );
}
