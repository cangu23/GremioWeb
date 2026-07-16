'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

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
      { threshold: 0.3 }
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
            padding: '60px 40px',
            borderRadius: '18px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(230,57,70,0.15)',
            background: 'linear-gradient(135deg, rgba(230,57,70,0.06), rgba(42,157,143,0.03))',
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Decorative elements */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,57,70,0.08), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-60px',
            width: '150px', height: '150px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(42,157,143,0.06), transparent)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px', height: '2px',
              background: 'var(--primary)',
              margin: '0 auto 20px',
              borderRadius: '1px',
            }} />

            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              fontWeight: 700,
              marginBottom: '14px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}>
              ¿Listo para{' '}
              <span style={{ color: 'var(--primary)' }}>brillar</span>?
            </h2>

            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              maxWidth: '480px',
              margin: '0 auto 32px',
              lineHeight: 1.7,
            }}>
              Únete a la comunidad de VTubers más vibrante. Crea tu perfil, conecta con otros
              creadores y lleva tu personaje al siguiente nivel.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {user ? (
                <Link href="/dashboard" className="btn btn--lg">
                  Ir al Dashboard
                </Link>
              ) : (
                <Link href="/register" className="btn btn--lg">
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
