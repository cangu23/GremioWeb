'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { setSfxMuted, attachMusicVisualizer, getMusicAnalyser } from '@/lib/sfx';
import { FourPointStar } from '@/components/ui/Icons';

/* Track: frontend/public/audio/stelar.mp3 */
const AUDIO_SRC = '/audio/stelar.mp3';

/**
 * Site-wide background music player. Mounted once in the root layout so the SAME
 * <audio> element lives across every route (landing, feed, profiles, auth, …)
 * without restarting on navigation.
 *
 * Position is adaptive: top-right on /login & /register, bottom-left on all other pages.
 */
export default function GlobalMusicPlayer() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const fadeTimer = useRef<number | null>(null);

  // Sync SFX mute state with background music
  useEffect(() => {
    setSfxMuted(!playing);
  }, [playing]);

  // Create the audio element once and check the file is reachable
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = 0;
    audioRef.current = audio;
    // Visualizer attached on user gesture below

    const handleCanPlay = () => setReady(true);
    const handleError = () => setReady(false);

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

  // Autoplay attempt on first user gesture
  useEffect(() => {
    if (!ready) return;
    const handleFirstInteraction = () => {
      const audio = audioRef.current;
      if (!audio || userToggled) return;
      attachMusicVisualizer(audio);
      audio
        .play()
        .then(() => {
          fadeTo(0.28, 1800);
          setPlaying(true);
        })
        .catch(() => {
          /* autoplay blocked */
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
    attachMusicVisualizer(audio);

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

  // ── Celestial Equalizer Bars synced to live music frequency data ──
  useEffect(() => {
    if (!playing) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = '3px';
      });
      return;
    }

    let raf = 0;
    const smoothBars = [3, 3, 3, 3, 3];
    const data = new Uint8Array(128);

    const step = () => {
      const analyser = getMusicAnalyser();
      if (analyser) {
        analyser.getByteFrequencyData(data);
        const bands = [
          data[2] || 0,
          data[8] || 0,
          data[18] || 0,
          data[36] || 0,
          data[64] || 0,
        ];
        bands.forEach((val, i) => {
          const target = 3 + (val / 255) * 15;
          smoothBars[i] += (target - smoothBars[i]) * 0.35;
          const bar = barsRef.current[i];
          if (bar) {
            bar.style.height = `${smoothBars[i].toFixed(1)}px`;
          }
        });
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (!ready) return null;

  return (
    <div
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      aria-label={playing ? 'Silenciar música estelar' : 'Reproducir música estelar'}
      aria-pressed={playing}
      title={playing ? 'Silenciar música estelar' : 'Reproducir música estelar'}
      className="global-music-capsule"
      style={{
        position: 'fixed',
        top: isAuthPage ? '22px' : undefined,
        right: isAuthPage ? '36px' : undefined,
        left: isAuthPage ? undefined : '22px',
        bottom: isAuthPage ? undefined : '22px',
        zIndex: isAuthPage ? 1000000 : 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '5px 10px 5px 12px',
        height: '38px',
        boxSizing: 'border-box',
        borderRadius: '20px',
        background: playing
          ? 'linear-gradient(135deg, rgba(14, 20, 42, 0.88) 0%, rgba(8, 12, 26, 0.92) 100%)'
          : 'rgba(8, 12, 26, 0.72)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: `1px solid ${playing ? 'rgba(232, 199, 122, 0.38)' : 'rgba(232, 199, 122, 0.2)'}`,
        boxShadow: playing
          ? '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.12), inset 0 1px 0 rgba(255, 248, 225, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.35)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 4-pointed star status indicator */}
      <FourPointStar
        size={11}
        color={playing ? '#F5E7B0' : 'rgba(232, 199, 122, 0.5)'}
        style={{
          filter: playing ? 'drop-shadow(0 0 6px rgba(245,231,176,0.8))' : 'none',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Label */}
      <span
        className="music-capsule-label"
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: playing ? '#FAF6EE' : 'rgba(245, 239, 223, 0.5)',
          whiteSpace: 'nowrap',
          transition: 'color 0.3s ease',
        }}
      >
        {playing ? 'Sintonía Estelar' : 'Música'}
      </span>

      {/* Fine divider */}
      <div
        style={{
          width: '1px',
          height: '14px',
          background: 'rgba(232, 199, 122, 0.25)',
          margin: '0 2px',
        }}
      />

      {/* Equalizer Frequency Bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5px',
          height: '18px',
          padding: '0 2px',
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            style={{
              display: 'block',
              width: '2.5px',
              height: '3px',
              borderRadius: '2px',
              background: playing
                ? 'linear-gradient(to top, #D4AF37, #FAF4E4)'
                : 'rgba(245, 239, 223, 0.22)',
              boxShadow: playing ? '0 0 6px rgba(212, 175, 55, 0.45)' : 'none',
              transition: playing ? 'none' : 'height 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Audio Icon Button with delicate starlight circle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: playing
            ? 'linear-gradient(135deg, rgba(232, 199, 122, 0.25), rgba(212, 175, 55, 0.15))'
            : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${playing ? 'rgba(232, 199, 122, 0.45)' : 'rgba(255, 255, 255, 0.1)'}`,
          color: playing ? '#F5E7B0' : 'rgba(245, 239, 223, 0.45)',
          boxShadow: playing ? '0 0 10px rgba(212, 175, 55, 0.3)' : 'none',
          transition: 'all 0.3s ease',
          marginLeft: '2px',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
          {!playing && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.4" />}
        </svg>
      </div>

      <style jsx>{`
        .global-music-capsule:hover {
          transform: translateY(-1px);
          border-color: rgba(232, 199, 122, 0.55);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6), 0 0 22px rgba(212, 175, 55, 0.2);
        }
        @media (max-width: 600px) {
          .music-capsule-label {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
