'use client';

import { useEffect, useRef, useState } from 'react';

/* Where the user drops their track: frontend/public/audio/stelar.mp3 */
const AUDIO_SRC = '/audio/stelar.mp3';

export default function AuthMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const fadeTimer = useRef<number | null>(null);

  // Create the audio element once and check availability of the file
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    const handleCanPlay = () => {
      setReady(true);
    };
    const handleError = () => {
      // File missing → hide the button entirely (no console noise from UI)
      setReady(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
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

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Silenciar música' : 'Reproducir música'}
      aria-pressed={playing}
      title={playing ? 'Silenciar música' : 'Reproducir música'}
      style={{
        position: 'absolute',
        top: '24px',
        right: '36px',
        zIndex: 30,
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
  );
}
