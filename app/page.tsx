"use client";

import { useMemo, useState } from "react";

import { Board } from "@/components/board/board";
import { BoardTools } from "@/components/board/board-tools";
import { Composer } from "@/components/board/composer";
import { ProgramTools } from "@/components/board/program-tools";
import { useFlutter } from "@/components/board/use-flutter";
import { useLocalStorage } from "@/components/board/use-local-storage";
import { useProgramMessage } from "@/components/board/use-program-message";
import { boardsEqual, BOARD_SIZES, type BoardSizeKey, type BoardTheme } from "@/lib/board";
import {
  DEFAULT_MESSAGE,
  layoutMessage,
  layoutText,
  messagesEqual,
  type ActiveMessage,
  type HorizontalAlign,
  type VerticalAlign,
} from "@/lib/layout";
import { PRESETS, presetMessage, randomBoardText, type Preset } from "@/lib/presets";
import { DEFAULT_PROGRAM, renderProgram, type Program } from "@/lib/programs";
import { STORAGE_KEYS } from "@/lib/storage";

const EMPTY_HISTORY: ActiveMessage[] = [];
const HISTORY_LIMIT = 8;

export default function Home() {
  const [draft, setDraft] = useState(DEFAULT_MESSAGE.text);
  const [align, setAlign] = useState<HorizontalAlign>(DEFAULT_MESSAGE.align);
  const [blockAlign, setBlockAlign] = useState<HorizontalAlign>(DEFAULT_MESSAGE.blockAlign);
  const [vAlign, setVAlign] = useState<VerticalAlign>(DEFAULT_MESSAGE.vAlign);

  // The active program, size, and theme live in localStorage so a /present tab
  // on the same device mirrors this one (and the board survives reloads).
  const [program, setProgram] = useLocalStorage<Program>(STORAGE_KEYS.program, DEFAULT_PROGRAM);
  const [sizeKey, setSizeKey] = useLocalStorage<BoardSizeKey>(STORAGE_KEYS.size, "flagship");
  const [history, setHistory] = useLocalStorage<ActiveMessage[]>(
    STORAGE_KEYS.history,
    EMPTY_HISTORY,
  );
  const [soundOn, setSoundOn] = useLocalStorage<boolean>(STORAGE_KEYS.sound, false);
  const [theme, setTheme] = useLocalStorage<BoardTheme>(STORAGE_KEYS.theme, "light");

  const size = BOARD_SIZES[sizeKey];

  // The displayed board derives from what the program currently shows (a live
  // program re-renders on its own ticks), so changing the board size re-flows
  // the current content into the new dimensions.
  const message = useProgramMessage(program);
  const board = useMemo(() => layoutMessage(message, size).board, [message, size]);

  useFlutter(board, soundOn);

  // The draft is laid out continuously to drive Activate state and feedback, but
  // never touches the displayed board until activation.
  const layout = useMemo(
    () => layoutText(draft, { align, blockAlign, vAlign, rows: size.rows, columns: size.columns }),
    [draft, align, blockAlign, vAlign, size],
  );
  const canActivate = !boardsEqual(layout.board, board);

  function remember(message: ActiveMessage) {
    if (!message.text.trim()) return;
    setHistory((previous) =>
      [message, ...previous.filter((item) => !messagesEqual(item, message))].slice(
        0,
        HISTORY_LIMIT,
      ),
    );
  }

  function commit(message: ActiveMessage, options?: { remember?: boolean }) {
    setProgram({ kind: "message", message });
    if (options?.remember !== false) remember(message);
  }

  // Freeze the board on whatever the live program is showing right now.
  // Rendered directly (not via the hook's `message`) so stopping in the instant
  // before the program's first tick doesn't freeze the pre-mount blank board.
  function stopProgram() {
    setProgram({ kind: "message", message: renderProgram(program, Date.now()) });
  }

  // Load a message into the composer and activate it in one step.
  function applyMessage(message: ActiveMessage) {
    setDraft(message.text);
    setAlign(message.align);
    setBlockAlign(message.blockAlign);
    setVAlign(message.vAlign);
    commit(message);
  }

  function loadPreset(preset: Preset) {
    applyMessage(presetMessage(preset));
  }

  function shuffle() {
    // Fill every cell with a random glyph to exercise the flip animation; this
    // is an ephemeral test, so it isn't remembered.
    commit(
      {
        text: randomBoardText(size.rows, size.columns),
        align: "left",
        blockAlign: "left",
        vAlign: "top",
      },
      { remember: false },
    );
  }

  async function copyJson(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(board, null, 2));
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-black p-4 font-sans text-white sm:p-8">
      <main className="flex w-full max-w-4xl flex-col items-center gap-6">
        <Board state={board} theme={theme} className="w-full" />
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          align={align}
          onAlignChange={setAlign}
          blockAlign={blockAlign}
          onBlockAlignChange={setBlockAlign}
          vAlign={vAlign}
          onVAlignChange={setVAlign}
          sizeKey={sizeKey}
          onSizeChange={setSizeKey}
          onActivate={() => commit({ text: draft, align, blockAlign, vAlign })}
          onClear={() => setDraft("")}
          canActivate={canActivate}
          layout={layout}
        />
        <BoardTools
          onLoadPreset={loadPreset}
          onRandom={() => loadPreset(PRESETS[Math.floor(Math.random() * PRESETS.length)])}
          onShuffle={shuffle}
          onCopyJson={copyJson}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(!soundOn)}
          history={history}
          onLoadHistory={applyMessage}
          onClearHistory={() => setHistory(EMPTY_HISTORY)}
        />
        <ProgramTools program={program} onActivate={setProgram} onStop={stopProgram} />
      </main>
    </div>
  );
}
