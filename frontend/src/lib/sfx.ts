/**
 * SFX — subtle, synthesized sound effects for the site's audio system.
 *
 * The whoosh is generated with the Web Audio API (a band-passed noise sweep),
 * so it needs no audio file and can be synced to the page-transition veil down
 * to the millisecond. It obeys the SAME mute as the background music: when the
 * music button is off, no effect sounds — one button controls all site audio.
 */

let ctx: AudioContext | null = null;
let muted = true; // silent until the user turns the music on
let lastChime = 0; // throttle: avoid overlapping dings on message bursts

/** Called by GlobalMusicPlayer whenever the music toggle changes. */
export function setSfxMuted(m: boolean) {
  muted = m;
}

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        /* autoplay policy — resume on the next gesture */
      });
    }
    return ctx;
  } catch {
    return null;
  }
}

// Unlock the context on the first user gesture (autoplay policy).
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

/**
 * Play a subtle whoosh synced to the transition veil.
 * phase 'in'  → rising sweep as the black veil covers the screen.
 * phase 'out' → soft fall as the veil reveals the new page.
 */
export function playWhoosh(phase: 'in' | 'out') {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;

  try {
    const t0 = ac.currentTime + 0.01;
    const dur = phase === 'in' ? 0.55 : 0.7;
    const peak = phase === 'in' ? 0.075 : 0.04;

    // White-noise buffer shaped by the filter + envelope below.
    const buffer = ac.createBuffer(
      1,
      Math.max(1, Math.floor(ac.sampleRate * dur)),
      ac.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buffer;

    // Band-pass sweeping for the classic "whoosh" timbre.
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    if (phase === 'in') {
      filter.frequency.setValueAtTime(200, t0);
      filter.frequency.exponentialRampToValueAtTime(2600, t0 + dur * 0.75);
    } else {
      filter.frequency.setValueAtTime(1700, t0);
      filter.frequency.exponentialRampToValueAtTime(260, t0 + dur);
    }

    // Fast attack, smooth release — keep it subtle.
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.11);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(t0);
  } catch {
    /* audio unavailable — stay silent */
  }
}

/**
 * Play a soft two-note notification ding (A5 + E6) for new chat messages.
 * Throttled to one chime per 800ms so message bursts don't overlap.
 */
// ── Music waveform (ECG-style heartbeat visualizer) ───────────────────
// The site's background music is routed through the shared AudioContext so
// the visualizer can read its LIVE waveform via an AnalyserNode, making the
// drawn line pulse in sync with stelar.mp3. The audio keeps playing normally
// (src → analyser → destination).
let attachedElement: HTMLAudioElement | null = null;
let musicAnalyser: AnalyserNode | null = null;

/**
 * Route a music <audio> element through the shared context + analyser.
 * Safe to call again with a different element (e.g. after a StrictMode
 * remount): each element can only be routed once.
 */
export function attachMusicVisualizer(audio: HTMLAudioElement): AnalyserNode | null {
  if (attachedElement === audio) return musicAnalyser;
  const ac = ensureCtx();
  if (!ac) return null;
  try {
    const src = ac.createMediaElementSource(audio);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    src.connect(analyser);
    analyser.connect(ac.destination);
    attachedElement = audio;
    musicAnalyser = analyser;
    return analyser;
  } catch {
    return null;
  }
}

/** Live analyser of the playing music (null if unavailable). */
export function getMusicAnalyser(): AnalyserNode | null {
  return musicAnalyser;
}

export function playChime() {
  if (muted) return;
  const now = performance.now();
  if (now - lastChime < 800) return;
  lastChime = now;

  const ac = ensureCtx();
  if (!ac) return;

  try {
    const t0 = ac.currentTime + 0.01;
    const notes = [
      { freq: 880, gain: 0.05, dur: 0.9 }, // A5 — warm fundamental
      { freq: 1318.51, gain: 0.03, dur: 0.7 }, // E6 — bright fifth
    ];
    for (const n of notes) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, t0);

      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(n.gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);

      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + n.dur + 0.1);
    }
  } catch {
    /* audio unavailable — stay silent */
  }
}
