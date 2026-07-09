'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

const stats: Stat[] = [
  { value: 10000, suffix: '+', label: 'VTubers Activos', icon: '🎭' },
  { value: 500, suffix: '+', label: 'Eventos Realizados', icon: '📅' },
  { value: 250, suffix: '+', label: 'Gremios Creados', icon: '🏰' },
  { value: 100000, suffix: '+', label: 'Mensajes Enviados', icon: '💬' },
];

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(interval);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2px',
            padding: '0',
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                background: 'var(--card-bg)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(138,43,226,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card-bg)';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '8px',
                  lineHeight: 1.2,
                }}
              >
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
