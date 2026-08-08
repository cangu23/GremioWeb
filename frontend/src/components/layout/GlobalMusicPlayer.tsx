'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { setSfxMuted, attachMusicVisualizer, getMusicAnalyser } from '@/lib/sfx';

/* Track: frontend/public/audio/stelar.mp3 */
const AUDIO_SRC = '/audio/stelar.mp3';

/**
 * Site-wide background music. Mounted once in the root layout so the SAME
 * <audio> element lives across every route (landing, feed, profiles, … and
 * even the auth pages) — the music never restarts on navigation.
 *
 * Position is adaptive: top-right on /login & /register (matching the old
 * auth-only player), bottom-right floating on every other page.
 */
export default function GlobalMusicPlayer() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const fadeTimer = useRef<number | null>(null);

  // One audio button controls ALL site audio: SFX (transition whoosh) follow
  // the same mute state as the background music.
  useEffect(() => {
    setSfxMuted(!playing);
  }, [playing]);

  // Create the audio element once and check the file is reachable
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    // ⚡ OPTIMIZACIÓN: era 'auto' → cada página descargaba los 61 MB de
    // stelar.mp3 entero. 'metadata' solo lee la cabecera (~KB) y el archivo
    // se streamea cuando el usuario realmente reproduce (que ya es el flujo:
    // la música arranca tras el primer gesto del usuario).
    audio.preload = 'metadata';
    audio.volume = 0;
    audioRef.current = audio;
    // Route the music through the shared AudioContext so the ECG waveform
    // visualizer can read its live data (sound still flows: src→analyser→out).
    attachMusicVisualizer(audio);

    const handleCanPlay = () => {
      setReady(true);
    };
    const handleError = () => {
      // File missing → hide the button entirely (no console noise from UI)
      setReady(false);
    };

    // 'loadedmetadata' dispara con preload='metadata' (canplay espera a que
    // haya datos suficientes, que con metadata no llegan hasta reproducir).
    audio.addEventListener('loadedmetadata', handleCanPlay);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      if (fadeTimer.current) window.cancelAnimationFrame(fadeTimer.current);
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleCanPlay);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  // Smooth volume ramp (fade in/out)
  const fadeTo = (target: number, duration = 1200) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeTimer.current) window.cancelAnimationFrame(fadeTimer.current);
    const startVol = audio.volume;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      audio.volume = startVol + (target - startVol) * eased;
      if (t < 1) fadeTimer.current = window.requestAnimationFrame(step);
      else fadeTimer.current = null;
    };
    fadeTimer.current = window.requestAnimationFrame(step);
  };

  // Autoplay attempt: browsers block sound until the user interacts, so the
  // first click/tap anywhere starts the music gently.
  useEffect(() => {
    if (!ready) return;
    const handleFirstInteraction = () => {
      const audio = audioRef.current;
      if (!audio || userToggled) return;
      audio
        .play()
        .then(() => {
          fadeTo(0.28, 1800);
          setPlaying(true);
        })
        .catch(() => {
          /* autoplay blocked — user can press the button */
        });
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setUserToggled(true);

    if (playing) {
      fadeTo(0, 400);
      setTimeout(() => audio.pause(), 450);
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          fadeTo(0.28, 900);
          setPlaying(true);
        })
        .catch(() => {
          /* ignore */
        });
    }
  };

  // ── ECG heartbeat waveform, synced to the actual music ────────────────
  useEffect(() => {
    if (!playing) return;
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 180;
    const H = 40;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const data = new Uint8Array(256);
    const smooth = { v: 0 };
    let beat = 0;
    let last = performance.now();
    let raf = 0;

    // Classic ECG beat over phase 0..1 (P wave → sharp QRS zigzag → T wave)
    const ecgValue = (ph: number): number => {
      if (ph < 0.04) return Math.sin((ph / 0.04) * Math.PI) * 0.18; // P
      if (ph < 0.08) return 0; // PR segment
      if (ph < 0.12) return -((ph - 0.08) / 0.04) * 0.85; // Q ↓
      if (ph < 0.17) return -0.85 + ((ph - 0.12) / 0.05) * 1.7; // R ↑
      if (ph < 0.21) return 0.85 - ((ph - 0.17) / 0.04) * 1.7; // S ↓
      if (ph < 0.25) return -0.85 + ((ph - 0.21) / 0.04) * 0.85; // back
      if (ph < 0.3) return 0; // ST segment
      if (ph < 0.42) return Math.sin(((ph - 0.3) / 0.12) * Math.PI) * 0.32; // T
      return 0;
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      // Live energy of stelar.mp3 (0..~1)
      const analyser = getMusicAnalyser();
      let energy = 0;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        energy = Math.sqrt(sum / data.length);
      }
      smooth.v += (energy - smooth.v) * 0.25;

      // Louder music → taller spikes & a faster heartbeat
      const amp = 0.3 + smooth.v * 1.05;
      const beatRate = 1.05 + smooth.v * 0.7;
      beat = (beat + dt * beatRate) % 1;

      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const ph = (x / W) * 1.4 + beat;
        const phN = ph - Math.floor(ph);
        let y = H / 2 + ecgValue(phN) * H * 0.42 * amp;
        // Organic jitter from the real waveform riding the line
        if (analyser) {
          const idx = Math.min(data.length - 1, Math.floor((x / W) * data.length));
          y += ((data[idx] - 128) / 128) * 1.5 * smooth.v;
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(245, 231, 176, 0.95)';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.85)';
      ctx.shadowBlur = 9;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Faint mirrored echo below for a soft glow
      ctx.save();
      ctx.translate(0, H);
      ctx.scale(1, -0.45);
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = '#F5E7B0';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (!ready) return null;

  return (
    <>
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Silenciar música' : 'Reproducir música'}
      aria-pressed={playing}
      title={playing ? 'Silenciar música' : 'Reproducir música'}
      style={{
        position: 'fixed',
        // Auth pages: top-right (where the old auth-only player lived).
        // Regular pages: bottom-LEFT — the bottom-right corner is used by
        // the toast notifications (ToastContext, zIndex 10000).
        top: isAuthPage ? '24px' : undefined,
        right: isAuthPage ? '36px' : undefined,
        left: isAuthPage ? undefined : '22px',
        bottom: isAuthPage ? undefined : '22px',
        // Above the auth overlay (zIndex 999999) on login/register; above
        // regular content everywhere else.
        zIndex: isAuthPage ? 1000000 : 1000,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: `1px solid ${playing ? 'rgba(232, 199, 122, 0.55)' : 'rgba(232, 199, 122, 0.25)'}`,
        background: playing
          ? 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.12))'
          : 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: playing
          ? '0 0 20px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 4px 14px rgba(0,0,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        color: playing ? '#F5E7B0' : 'rgba(245, 239, 223, 0.6)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(232, 199, 122, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = playing
          ? 'rgba(232, 199, 122, 0.55)'
          : 'rgba(232, 199, 122, 0.25)';
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
        {!playing && (
          <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.2" />
        )}
      </svg>
      {playing && (
        <span
          style={{
            position: 'absolute',
            bottom: '5px',
            right: '6px',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#F5E7B0',
            boxShadow: '0 0 6px rgba(245,231,176,0.9)',
          }}
        />
      )}
    </button>

    {/* 💗 ECG heartbeat strip — pulses in sync with stelar.mp3 */}
    <canvas
      ref={waveformCanvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        // Auth pages: to the LEFT of the button (top-right). Regular pages:
        // to the RIGHT of the button (bottom-left). Same corner logic as the
        // music button so they always sit together.
        top: isAuthPage ? '24px' : undefined,
        right: isAuthPage ? '86px' : undefined,
        left: isAuthPage ? undefined : '72px',
        bottom: isAuthPage ? undefined : '22px',
        width: '180px',
        height: '40px',
        zIndex: isAuthPage ? 1000000 : 1000,
        opacity: playing ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
      }}
    />
    </>
  );
}
