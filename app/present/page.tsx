"use client";

import { Maximize, Minimize, PencilLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Board } from "@/components/board/board";
import { useFlutter } from "@/components/board/use-flutter";
import { useLocalStorage } from "@/components/board/use-local-storage";
import { useProgramMessage } from "@/components/board/use-program-message";
import { Button, buttonVariants } from "@/components/ui/button";
import { BOARD_SIZES, type BoardSizeKey, type BoardTheme } from "@/lib/board";
import { layoutMessage } from "@/lib/layout";
import { DEFAULT_PROGRAM, type Program } from "@/lib/programs";
import { STORAGE_KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";

/** Chrome and cursor hide after this much pointer/key inactivity. */
const IDLE_MS = 3000;

/**
 * Hold a screen wake lock while the sign is visible, so a mounted display
 * doesn't sleep. Browsers release the lock whenever the tab is hidden, so
 * re-acquire each time it becomes visible again.
 */
function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then(
        (sentinel) => {
          if (cancelled) sentinel.release().catch(() => {});
          else lock = sentinel;
        },
        () => {
          // Not granted (low battery, unsupported) — the sign still works,
          // the screen may just sleep.
        },
      );
    };

    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, []);
}

/** True after `ms` without pointer or key activity; drives chrome auto-hide. */
function useIdle(ms: number): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), ms);
    };

    wake();
    const events = ["pointermove", "pointerdown", "keydown"] as const;
    for (const event of events) window.addEventListener(event, wake);
    return () => {
      clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, wake);
    };
  }, [ms]);

  return idle;
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    // May be denied (e.g. not triggered by a user gesture) — stay windowed.
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

/**
 * Presentation mode: just the board, scaled to fill the viewport, with the
 * screen held awake. Reads the same localStorage-backed state as the composer
 * page, so activating a message in another tab flips this sign.
 */
export default function Present() {
  const [program] = useLocalStorage<Program>(STORAGE_KEYS.program, DEFAULT_PROGRAM);
  const [sizeKey] = useLocalStorage<BoardSizeKey>(STORAGE_KEYS.size, "flagship");
  const [theme] = useLocalStorage<BoardTheme>(STORAGE_KEYS.theme, "light");
  const [soundOn] = useLocalStorage<boolean>(STORAGE_KEYS.sound, false);

  const size = BOARD_SIZES[sizeKey];
  const message = useProgramMessage(program);
  const board = useMemo(() => layoutMessage(message, size).board, [message, size]);

  // Changes arrive from other tabs or program ticks; sound follows the shared
  // toggle, with the same only-when-flaps-move rule as the composer page.
  useFlutter(board, soundOn);

  useWakeLock();
  const idle = useIdle(IDLE_MS);

  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "f" || event.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main
      className={cn(
        "flex h-dvh w-full items-center justify-center overflow-hidden bg-black p-4 sm:p-6",
        idle && "cursor-none",
      )}
    >
      {/* Width-constrained by default; the dvh cap takes over on screens wider
          than the board's aspect ratio so it always fits the viewport. */}
      <div
        className="w-full"
        style={{ maxWidth: `${((90 * size.columns) / size.rows).toFixed(0)}dvh` }}
      >
        <Board state={board} theme={theme} className="w-full" />
      </div>

      <div
        className={cn(
          "fixed right-4 bottom-4 flex items-center gap-2 transition-opacity duration-500",
          idle ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <Link
          href="/"
          className={buttonVariants({
            size: "sm",
            variant: "ghost",
            className: "text-white/50 hover:bg-white/10 hover:text-white",
          })}
        >
          <PencilLine />
          Composer
        </Link>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={toggleFullscreen}
          className="text-white/50 hover:bg-white/10 hover:text-white"
        >
          {fullscreen ? <Minimize /> : <Maximize />}
          {fullscreen ? "Exit" : "Fullscreen"}
          <span className="text-white/30">F</span>
        </Button>
      </div>
    </main>
  );
}
