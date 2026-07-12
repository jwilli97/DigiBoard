# Digiboard

A digital split-flap message board (Vestaboard-inspired). Next.js App Router, React 19, Tailwind 4, TypeScript, pnpm.

## Commands

- `pnpm test` — vitest unit tests
- `pnpm lint` — eslint
- Don't run `pnpm dev` (assume it's running) or `pnpm build` unless asked.

## Architecture conventions

- **`lib/` is pure and tested; `components/` renders.** Board model (`lib/board.ts`), layout engine (`lib/layout.ts`), charset, cells, and programs are framework-free with vitest coverage. Keep new logic there, not in components.
- **Cells are single characters.** Board state is a flat `string[]`. Special cells (color chips, the blank/filler bit) are Unicode Private Use Area sentinels (`lib/cells.ts`) so they flow through the string-based draft → layout → board pipeline as ordinary one-wide cells.
- **`lib/charset.ts` is the single source of truth for glyphs.** Message validation and the split-flap roll wheel both derive from `SUPPORTED_CHARS`; never define a separate character list.
- **Programs are pure functions of time.** `renderProgram(program, now)` returns the message; `nextTickAt(program, now)` says when output can next change. Displays tick locally (`use-program-message.ts`) — no per-tick state is stored or exchanged, which is how multiple tabs stay in sync. New live content should follow this shape.
- **Tabs sync via localStorage.** The active program, size, and theme live in localStorage (`lib/storage.ts` keys, `use-local-storage.ts` hook) so `/present` mirrors the composer page. The hook's setter accepts a functional updater — use it for read-modify-write (e.g. history).
- **The board data model is renderer-independent.** Nothing in `lib/` may import from `slot-text`; the renderer is meant to be swappable.
- **Animation never shifts layout.** Cells have fixed dimensions; glyph size scales via container-query units on the board, not the viewport.

## Style

- No `any`. Comments explain *why* (constraints, non-obvious behavior), not what the next line does.
- Accessibility matters here: sr-only live region on the board, reduced-motion support, aria labels on icon buttons. Preserve these when editing.
