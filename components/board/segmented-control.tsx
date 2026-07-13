"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  /** Icon shown for the segment; falls back to `label` text when omitted. */
  icon?: LucideIcon;
  label: string;
}

/**
 * A small labeled group of mutually exclusive options. The label always names
 * the group for assistive tech; `labelHidden` drops it visually when the
 * options are self-explanatory in context.
 */
export function SegmentedControl<T extends string>({
  label,
  labelHidden,
  value,
  onChange,
  options,
}: {
  label: string;
  labelHidden?: boolean;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("text-xs text-white/40", labelHidden && "sr-only")}>{label}</span>
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
