import { describe, expect, it } from "vitest";

import { COLOR_CHIPS } from "@/lib/cells";
import type { ActiveMessage } from "@/lib/layout";
import { nextTickAt, renderProgram, type Program } from "@/lib/programs";

// Local-time constructor keeps the tests timezone-independent, since the
// clock program formats with local getters.
const at = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
): number => new Date(year, month - 1, day, hours, minutes, seconds).getTime();

const message = (text: string): ActiveMessage => ({
  text,
  align: "left",
  blockAlign: "left",
  vAlign: "top",
});

describe("renderProgram", () => {
  it("passes a static message through untouched", () => {
    const program: Program = { kind: "message", message: message("HI") };
    expect(renderProgram(program, at(2026, 7, 8, 12, 0))).toBe(program.message);
  });

  it("formats a 12h clock with its date line", () => {
    const program: Program = { kind: "clock", format: "12h" };
    expect(renderProgram(program, at(2026, 7, 8, 14, 41)).text).toBe("WED JUL 8\n2:41 PM");
    expect(renderProgram(program, at(2026, 7, 8, 0, 5)).text).toBe("WED JUL 8\n12:05 AM");
    expect(renderProgram(program, at(2026, 7, 8, 12, 0)).text).toBe("WED JUL 8\n12:00 PM");
  });

  it("formats a 24h clock with padded hours", () => {
    const program: Program = { kind: "clock", format: "24h" };
    expect(renderProgram(program, at(2026, 7, 8, 9, 5)).text).toBe("WED JUL 8\n09:05");
    expect(renderProgram(program, at(2026, 7, 8, 14, 41)).text).toBe("WED JUL 8\n14:41");
  });

  it("shows day/hour/minute parts when more than an hour remains", () => {
    const target = "2026-07-11T18:30";
    const program: Program = { kind: "countdown", target };
    expect(renderProgram(program, at(2026, 7, 8, 14, 30)).text).toBe("3D 4H 0M");
    expect(renderProgram(program, at(2026, 7, 11, 15, 55)).text).toBe("2H 35M");
  });

  it("switches to MM:SS inside the final hour and prepends the label", () => {
    const target = "2026-07-11T18:30";
    const program: Program = { kind: "countdown", target, label: "LAUNCH" };
    expect(renderProgram(program, at(2026, 7, 11, 17, 40, 30)).text).toBe("LAUNCH\n49:30");
    expect(renderProgram(program, at(2026, 7, 11, 18, 29, 59)).text).toBe("LAUNCH\n00:01");
  });

  it("lands on a chip-framed finale once the target passes", () => {
    const chips = COLOR_CHIPS.map((chip) => chip.char).join("");
    const program: Program = { kind: "countdown", target: "2026-07-11T18:30", label: "LAUNCH" };
    expect(renderProgram(program, at(2026, 7, 11, 18, 30)).text).toBe(
      `${chips}\nLAUNCH\n${chips}`,
    );
    const unlabeled: Program = { kind: "countdown", target: "2026-07-11T18:30" };
    expect(renderProgram(unlabeled, at(2026, 7, 12, 0, 0)).text).toBe(
      `${chips}\nTIME'S UP\n${chips}`,
    );
  });

  it("rotates through messages on the shared epoch grid", () => {
    const slides = [message("A"), message("B"), message("C")];
    const program: Program = { kind: "rotation", messages: slides, intervalSeconds: 10 };
    expect(renderProgram(program, 0)).toBe(slides[0]);
    expect(renderProgram(program, 10_000)).toBe(slides[1]);
    expect(renderProgram(program, 29_999)).toBe(slides[2]);
    expect(renderProgram(program, 30_000)).toBe(slides[0]);
  });

  it("renders an empty rotation as a blank board", () => {
    const program: Program = { kind: "rotation", messages: [], intervalSeconds: 10 };
    expect(renderProgram(program, 0).text).toBe("");
  });
});

describe("nextTickAt", () => {
  it("never ticks a static message", () => {
    expect(nextTickAt({ kind: "message", message: message("HI") }, 0)).toBeNull();
  });

  it("ticks a clock at the next minute boundary", () => {
    const now = at(2026, 7, 8, 14, 41, 30);
    expect(nextTickAt({ kind: "clock", format: "12h" }, now)).toBe(at(2026, 7, 8, 14, 42));
  });

  it("ticks a countdown every second until the target, then stops", () => {
    const program: Program = { kind: "countdown", target: "2026-07-11T18:30" };
    const now = at(2026, 7, 11, 18, 29, 59) + 250;
    expect(nextTickAt(program, now)).toBe(at(2026, 7, 11, 18, 30));
    expect(nextTickAt(program, at(2026, 7, 11, 18, 30))).toBeNull();
    expect(nextTickAt({ kind: "countdown", target: "not a date" }, now)).toBeNull();
  });

  it("ticks a rotation at slide boundaries, but not with one slide", () => {
    const slides = [message("A"), message("B")];
    expect(nextTickAt({ kind: "rotation", messages: slides, intervalSeconds: 10 }, 12_345)).toBe(
      20_000,
    );
    expect(
      nextTickAt({ kind: "rotation", messages: [message("A")], intervalSeconds: 10 }, 12_345),
    ).toBeNull();
  });
});
