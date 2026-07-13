'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function CTASection() {
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
      style={{
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="container">
        <div
          className="glass"
          style={{
            padding: '80px 40px',
            borderRadius: '32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(138,43,226,0.2)',
            background:
              'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(255,0,127,0.05))',
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(138,43,226,0.15), transparent)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,0,127,0.1), transparent)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: '60px',
                height: '3px',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                margin: '0 auto 24px',
              }}
            />

            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              ¿Listo para{' '}
              <span className="gradient-text">brillar</span>?
            </h2>

            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-muted)',
                maxWidth: '500px',
                margin: '0 auto 40px',
                lineHeight: 1.7,
              }}
            >
              Únete a la comunidad de VTubers más vibrante. Crea tu perfil, conecta con otros
              creadores y lleva tu personaje al siguiente nivel.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/register"
                className="btn"
                style={{
                  padding: '18px 40px',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  boxShadow: '0 0 40px rgba(138,43,226,0.3)',
                }}
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/vtubers"
                className="btn btn-outline"
                style={{
                  padding: '18px 40px',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  borderRadius: '14px',
                }}
              >
                Explorar VTubers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
