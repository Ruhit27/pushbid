import confetti from "canvas-confetti";

/** Bursts confetti in the brand colours onto `canvas`. A new user gets side cannons as well as the centre burst. */
export function confettiBurst(canvas: HTMLCanvasElement, big: boolean) {
  const fire = confetti.create(canvas, { resize: true, disableForReducedMotion: true });
  const css = getComputedStyle(document.documentElement);
  const colors = ["--brand", "--gold", "--brand-soft"].map((v) => css.getPropertyValue(v).trim()).concat("#ffffff");
  fire({ particleCount: big ? 140 : 70, spread: 80, startVelocity: 45, origin: { y: 0.6 }, colors });
  if (!big) return;
  setTimeout(() => {
    fire({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.85 }, colors });
    fire({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.85 }, colors });
  }, 250);
}

/**
 * A short rising coin chime, synthesised so there's no audio file to load. Browsers only allow sound after the
 * visitor has interacted with the page, so this resolves to false when it was blocked and can be retried on a click.
 */
export async function chime(): Promise<boolean> {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const ctx = new AudioContext();
  if (ctx.state === "suspended") {
    await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 150))]);
    if ((ctx.state as AudioContextState) !== "running") {
      ctx.close();
      return false;
    }
  }
  const notes = [659.25, 783.99, 1046.5, 1318.51]; // E5 G5 C6 E6
  notes.forEach((freq, i) => {
    const at = ctx.currentTime + i * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.5);
  });
  setTimeout(() => ctx.close(), 1200);
  return true;
}
