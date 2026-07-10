import { describe, expect, it } from "vitest";

import { COLOR_CHIPS } from "@/lib/cells";
import { isSupportedChar, SUPPORTED_CHARS, wheelDistance } from "@/lib/charset";

describe("character set", () => {
  it("supports letters, digits, and a blank", () => {
    expect(isSupportedChar("A")).toBe(true);
    expect(isSupportedChar("Z")).toBe(true);
    expect(isSupportedChar("0")).toBe(true);
    expect(isSupportedChar(" ")).toBe(true);
  });

  it("supports the documented punctuation, including ° and •", () => {
    for (const char of "!@#$()-+&=;:'\"%,./?°•") {
      expect(isSupportedChar(char)).toBe(true);
    }
  });

  it("rejects lowercase and unsupported symbols", () => {
    expect(isSupportedChar("a")).toBe(false);
    expect(isSupportedChar("é")).toBe(false);
    expect(isSupportedChar("™")).toBe(false);
  });

  it("starts the flap order with a blank for blank-first rolling", () => {
    expect(SUPPORTED_CHARS[0]).toBe(" ");
    expect(SUPPORTED_CHARS).toContain("A");
  });
});

describe("wheelDistance", () => {
  it("is 1 for adjacent glyphs in either direction", () => {
    expect(wheelDistance("5", "6")).toBe(1);
    expect(wheelDistance("6", "5")).toBe(1);
    expect(wheelDistance("S", "T")).toBe(1);
  });

  it("measures farther glyphs and unchanged ones", () => {
    expect(wheelDistance("0", "5")).toBe(5);
    expect(wheelDistance("A", "A")).toBe(0);
  });

  it("wraps around the end of the wheel", () => {
    const last = SUPPORTED_CHARS[SUPPORTED_CHARS.length - 1];
    expect(wheelDistance(last, " ")).toBe(1);
  });

  it("is infinite for glyphs that are not on the wheel", () => {
    expect(wheelDistance("a", "b")).toBe(Number.POSITIVE_INFINITY);
    // Chip sentinels aren't on the wheel, so chip changes never read as a tick.
    expect(wheelDistance(COLOR_CHIPS[0].char, "A")).toBe(Number.POSITIVE_INFINITY);
  });
});
