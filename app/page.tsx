"use client";

import { useMemo, useState } from "react";

import { Board } from "@/components/board/board";
import { BoardTools } from "@/components/board/board-tools";
import { Composer } from "@/components/board/composer";
import { useLocalStorage } from "@/components/board/use-local-storage";
import {
  boardsEqual,
  BOARD_SIZES,
  type BoardSizeKey,
  type BoardTheme,
} from "@/lib/board";
import {
  layoutText,
  type ActiveMessage,
  type HorizontalAlign,
  type VerticalAlign,
} from "@/lib/layout";
import { PRESETS, randomBoardText, type Preset } from "@/lib/presets";
import { playFlutter } from "@/lib/sound";

const INITIAL: ActiveMessage = {
  text: "HELLO WORLD",
  align: "left",
  blockAlign: "left",
  vAlign: "top",
};

const EMPTY_HISTORY: ActiveMessage[] = [];
const HISTORY_LIMIT = 8;

export default function Home() {
  const [draft, setDraft] = useState(INITIAL.text);
  const [align, setAlign] = useState<HorizontalAlign>(INITIAL.align);
  const [blockAlign, setBlockAlign] = useState<HorizontalAlign>(INITIAL.blockAlign);
  const [vAlign, setVAlign] = useState<VerticalAlign>(INITIAL.vAlign);
  const [sizeKey, setSizeKey] = useState<BoardSizeKey>("flagship");
  const [active, setActive] = useState<ActiveMessage>(INITIAL);

  const [history, setHistory] = useLocalStorage<ActiveMessage[]>(
    "digiboard:history",
    EMPTY_HISTORY,
  );
  const [soundOn, setSoundOn] = useLocalStorage<boolean>("digiboard:sound", false);
  const [theme, setTheme] = useLocalStorage<BoardTheme>("digiboard:theme", "light");

  const size = BOARD_SIZES[sizeKey];

  // The displayed board is derived from the last-activated message, so changing
  // the board size re-flows the current message into the new dimensions.
  const board = useMemo(
    () =>
      layoutText(active.text, {
        align: active.align,
        blockAlign: active.blockAlign,
        vAlign: active.vAlign,
        rows: size.rows,
        columns: size.columns,
      }).board,
    [active, size],
  );

  // The draft is laid out continuously to drive Activate state and feedback, but
  // never touches the displayed board until activation.
  const layout = useMemo(
    () => layoutText(draft, { align, blockAlign, vAlign, rows: size.rows, columns: size.columns }),
    [draft, align, blockAlign, vAlign, size],
  );
  const canActivate = !boardsEqual(layout.board, board);

  function remember(message: ActiveMessage) {
    if (!message.text.trim()) return;
    setHistory(
      [message, ...history.filter((item) => item.text !== message.text)].slice(0, HISTORY_LIMIT),
    );
  }

  function commit(message: ActiveMessage, options?: { remember?: boolean }) {
    setActive(message);
    if (soundOn) playFlutter();
    if (options?.remember !== false) remember(message);
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
    applyMessage({
      text: preset.text,
      align: preset.align ?? "left",
      blockAlign: preset.blockAlign ?? "left",
      vAlign: preset.vAlign ?? "top",
    });
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
      </main>
    </div>
  );
}
