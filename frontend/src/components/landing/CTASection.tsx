'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Star } from '@/components/ui/Icons';

export default function CTASection() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section"
      id="auditions"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div
          style={{
            padding: '64px 36px',
            borderRadius: '24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(139,92,246,0.3)',
            background: 'linear-gradient(155deg, rgba(20,20,30,0.95), rgba(12,12,18,0.98))',
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.1)',
          }}
        >
          {/* Animated Glow Border */}
          <div className="landing-price-glow" />

          {/* Background Japanese Agency Monogram / Watermark */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 'clamp(5rem, 15vw, 11rem)',
              fontWeight: 900,
              color: 'rgba(255,255,255,0.015)',
              userSelect: 'none',
              pointerEvents: 'none',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}
          >
            GREMIO ESTELAR
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
              <span className="landing-eyebrow">
                AUDITION & RECRUIT // オーディション・参加募集
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)',
                fontWeight: 900,
                marginBottom: '16px',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
              }}
            >
              ¿Creas contenido o eres VTuber?{' '}
              <span className="landing-gradient-text">El Gremio abre sus puertas</span>
            </h2>

            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-muted)',
                maxWidth: '620px',
                margin: '0 auto 34px',
                lineHeight: 1.75,
              }}
            >
              Extendiendo la cultura virtual a través de la creación. Únete a la red VTuber en español:
              recibe soporte oficial, alertas en directo, Códigos de Creador con 35% de comisión y una comunidad activa.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {user ? (
                <Link href="/dashboard" className="btn btn--lg btn--shine" style={{ padding: '12px 28px', fontWeight: 800 }}>
                  Ir a mi Panel // DASHBOARD
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn--lg btn--shine" style={{ padding: '12px 28px', fontWeight: 800 }}>
                    ✦ Registrarme como Creador // APPLY
                  </Link>
                  <Link href="/register" className="btn btn--outline btn--lg" style={{ padding: '12px 26px', fontWeight: 700 }}>
                    Unirse como Fan // JOIN AS FAN
                  </Link>
                </>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '36px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
              }}
            >
              <span>✓ 100% Gratuito</span>
              <span>✓ 35% Comisión con Código</span>
              <span>✓ Sin Algoritmos Ocultos</span>
              <span>✓ Comunidad Hispana</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
