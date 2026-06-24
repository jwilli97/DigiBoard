import { describe, expect, it } from "vitest";

import { isSupportedChar, SUPPORTED_CHARS } from "@/lib/charset";

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
