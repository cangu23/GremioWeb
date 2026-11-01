'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles } from '@/components/ui/Icons';

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
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div
          style={{
            padding: '64px 40px',
            borderRadius: '22px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(139,92,246,0.22)',
            background: 'linear-gradient(150deg, rgba(139,92,246,0.12), rgba(108,180,238,0.05) 45%, rgba(245,158,11,0.05))',
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 60px rgba(139,92,246,0.08)',
          }}
        >
          {/* Animated aurora glow border */}
          <div className="landing-price-glow" />

          {/* Decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)',
              pointerEvents: 'none',
              animation: 'landingFloat 10s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(108,180,238,0.14), transparent 70%)',
              pointerEvents: 'none',
              animation: 'landingFloat 12s ease-in-out infinite reverse',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span className="landing-eyebrow" style={{ marginBottom: '20px' }}>
              Comunidad de Creadores & Fans
            </span>

            <h2
              style={{
                fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)',
                fontWeight: 800,
                marginBottom: '14px',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
              }}
            >
              ¿Listo para formar parte del <span className="landing-gradient-text">Gremio Estelar</span>?
            </h2>

            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-muted)',
                maxWidth: '540px',
                margin: '0 auto 34px',
                lineHeight: 1.75,
              }}
            >
              Únete a la red VTuber hispanohablante. Descubre transmisiones en vivo, comparte tu contenido,
              apoya a tus talentos favoritos con Códigos de Creador y desbloquea el Pase Estelar.
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
                <Link href="/dashboard" className="btn btn--lg btn--shine">
                  Ir al Dashboard
                </Link>
              ) : (
                <Link href="/register" className="btn btn--lg btn--shine">
                  ✦ Crear cuenta gratis
                </Link>
              )}
              <Link href="/vtubers" className="btn btn--outline btn--lg">
                Explorar VTubers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
