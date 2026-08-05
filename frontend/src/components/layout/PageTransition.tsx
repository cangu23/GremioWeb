'use client';

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { playWhoosh } from '@/lib/sfx';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Subtle content entrance (kept from the previous fade behavior)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, [pathname]);

  // ── Full-screen logo veil (Genshin-style page transition) ────────────
  // 'hidden' → nothing; 'visible' → black + logo instantly; 'fading' → reveal
  const [overlayPhase, setOverlayPhase] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  const prevPath = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useLayoutEffect(() => {
    // Skip the initial load (and StrictMode remounts on the same path).
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    // 1. Cover the viewport with black + logo BEFORE the browser paints the
    //    new page, so the old page never flashes. The whoosh-in sweeps up
    //    exactly as the veil appears (only when site audio is unmuted).
    setOverlayPhase('visible');
    playWhoosh('in');

    // 2. Hold a beat, then fade out revealing the new page (soft whoosh-out).
    timers.current.push(
      setTimeout(() => {
        setOverlayPhase('fading');
        playWhoosh('out');
      }, 560)
    );
    timers.current.push(setTimeout(() => setOverlayPhase('hidden'), 1050));

    return () => timers.current.forEach(clearTimeout);
  }, [pathname]);

  return (
    <>
      {/* ── BLACK VEIL + BIG LOGO ── */}
      {overlayPhase !== 'hidden' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000, // above everything, including the auth overlay
            background: '#000000', // absolutely black, as requested
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '26px',
            opacity: overlayPhase === 'visible' ? 1 : 0,
            transition:
              overlayPhase === 'fading'
                ? 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
            pointerEvents: overlayPhase === 'visible' ? 'auto' : 'none',
          }}
        >
          {/* Logo grande con resplandor dorado */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Gremio Estelar"
            style={{
              width: 'min(240px, 55vw)',
              height: 'auto',
              filter:
                'drop-shadow(0 0 28px rgba(212,175,55,0.5)) drop-shadow(0 0 90px rgba(212,175,55,0.22))',
              animation: 'pageTransitionLogo 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          />
          {/* Barrita de carga dorada */}
          <div
            style={{
              width: 'min(220px, 55vw)',
              height: '2px',
              borderRadius: '2px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '40%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, #F5E7B0, #D4AF37, transparent)',
                animation: 'pageTransitionShimmer 0.9s linear infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Content — usa la propiedad CSS `translate` (no `transform`):
          `transform` crea un containing block que desvía los position:fixed
          internos (modales) del viewport; `translate` no lo crea. */}
      <div
        style={{
          opacity: mounted ? 1 : 0,
          translate: mounted ? '0 0' : '0 10px',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), translate 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>

      <style jsx global>{`
        @keyframes pageTransitionLogo {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pageTransitionShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </>
  );
}
