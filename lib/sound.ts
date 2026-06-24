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

/** Play a flutter of mechanical ticks spread across `durationMs`. */
export function playFlutter(durationMs = 1100): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const count = Math.max(6, Math.round(durationMs / 45));
  const now = ctx.currentTime;
  for (let i = 0; i < count; i++) {
    const jitter = Math.random() * 0.012;
    tick(ctx, now + (i * durationMs) / count / 1000 + jitter);
  }
}
