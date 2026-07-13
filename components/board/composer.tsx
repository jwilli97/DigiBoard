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

import { SegmentedControl, type SegmentOption } from "@/components/board/segmented-control";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BLANK_BIT, COLOR_CHIPS, SYMBOL_BITS } from "@/lib/cells";
import type { HorizontalAlign, LayoutResult, VerticalAlign } from "@/lib/layout";

interface ComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  /** Combined horizontal alignment: where the text sits on the board. */
  align: HorizontalAlign;
  onAlignChange: (value: HorizontalAlign) => void;
  /** Vertical position of the text block on the board. */
  vAlign: VerticalAlign;
  onVAlignChange: (value: VerticalAlign) => void;
  onActivate: () => void;
  onClear: () => void;
  canActivate: boolean;
  layout: LayoutResult;
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

/**
 * Drafting controls for the board: one framed card holding the message and its
 * special-bit toolbar, then a single action row where Activate is the star.
 * Typing only updates local draft state — the board is not touched until
 * Activate is pressed (or Enter on a single line).
 */
export function Composer({
  draft,
  onDraftChange,
  align,
  onAlignChange,
  vAlign,
  onVAlignChange,
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
      <div className="flex w-full flex-col rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-white/40 focus-within:ring-3 focus-within:ring-white/10">
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
          className="w-full resize-none bg-transparent px-3 py-2.5 font-mono text-sm uppercase text-white outline-none placeholder:text-white/40 placeholder:normal-case"
        />

        {/* Special-bit toolbar and live feedback, inside the card */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 px-3 py-2">
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

          <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {layout.overflow && (
              <span className="text-amber-400">Message too long — extra rows were cut.</span>
            )}
            {layout.unsupported.length > 0 && (
              <span className="text-amber-400">
                Dropped unsupported: {layout.unsupported.map((c) => JSON.stringify(c)).join(" ")}
              </span>
            )}
            <span className="text-white/45 tabular-nums">
              {layout.usedCells}/{layout.totalCells} cells
            </span>
          </div>
        </div>
      </div>

      {/* One action row: alignment on the left, the primary action on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Align"
            value={align}
            onChange={onAlignChange}
            options={H_ALIGN_OPTIONS}
          />
          <SegmentedControl
            label="Vertical"
            labelHidden
            value={vAlign}
            onChange={onVAlignChange}
            options={V_ALIGN_OPTIONS}
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
            size="lg"
            disabled={!canActivate}
            className="bg-white px-6 font-semibold text-black hover:bg-white/85"
          >
            <Send />
            Activate
          </Button>
        </div>
      </div>
    </form>
  );
}
