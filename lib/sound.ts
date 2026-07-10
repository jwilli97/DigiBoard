// Synthesized mechanical "flutter" — a burst of soft ticks evoking split-flap
// cells turning. Uses the Web Audio API directly, so there are no audio assets
// to ship. Created lazily on first use (which happens during a user gesture, so
// the AudioContext is allowed to start).

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/** Schedule one short, dry click at the given audio-clock time. */
function tick(ctx: AudioContext, at: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(170 + Math.random() * 130, at);

  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.045, at + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);

  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.035);
}

/**
 * The context, if it's actually able to play right now. While suspended (no
 * user gesture yet) the audio clock is frozen, so anything scheduled "now"
 * piles up and fires all at once on resume — a burst of noise. Kick off a
 * resume for next time and skip this sound instead.
 */
function getRunningContext(): AudioContext | null {
  const ctx = getContext();
  if (!ctx) return null;
  if (ctx.state !== "running") {
    void ctx.resume();
    return null;
  }
  return ctx;
}

/** Play a flutter of mechanical ticks spread across `durationMs`. */
export function playFlutter(durationMs = 1100): void {
  const ctx = getRunningContext();
  if (!ctx) return;

  const count = Math.max(6, Math.round(durationMs / 45));
  const now = ctx.currentTime;
  for (let i = 0; i < count; i++) {
    const jitter = Math.random() * 0.012;
    tick(ctx, now + (i * durationMs) / count / 1000 + jitter);
  }
}

/** Play one dry mechanical click — a single flap advancing — after `delayMs`. */
export function playClick(delayMs = 0): void {
  const ctx = getRunningContext();
  if (!ctx) return;
  tick(ctx, ctx.currentTime + delayMs / 1000);
}

let unlockArmed = false;

/**
 * Browsers only let audio start during a user gesture, so a freshly loaded
 * page with sound already enabled would stay silent — its sounds come from
 * timer ticks and storage events, not clicks. Arming this once per page adds
 * listeners that create/resume the context on any interaction, after which
 * gesture-less playback is allowed for the rest of the session.
 */
export function unlockSound(): void {
  if (typeof window === "undefined" || unlockArmed) return;
  unlockArmed = true;

  const unlock = () => {
    const ctx = getContext();
    if (ctx?.state === "suspended") void ctx.resume();
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}
