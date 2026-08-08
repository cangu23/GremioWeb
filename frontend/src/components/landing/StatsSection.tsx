'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PlatformStats {
  totalVtubers: number;
  totalEvents: number;
  totalGuilds: number;
  totalPosts: number;
  totalUsers: number;
}

interface StatDisplay {
  value: number;
  suffix: string;
  label: string;
  key: keyof PlatformStats;
}

const statConfigs: StatDisplay[] = [
  { value: 0, suffix: '+', label: 'VTubers Registrados', key: 'totalVtubers' },
  { value: 0, suffix: '+', label: 'Eventos Realizados', key: 'totalEvents' },
  { value: 0, suffix: '+', label: 'Gremios Creados', key: 'totalGuilds' },
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
          if (target === 0) {
            setCount(0);
            return;
          }
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

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function StatsSection() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/stats', {});
        setStats(data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsWithValues = statConfigs.map((config) => ({
    ...config,
    value: stats?.[config.key] ?? 0,
  }));

  return (
    <section
      ref={sectionRef}
      className="section"
      style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}
    >
      <div className="landing-orb" style={{
        width: 400, height: 400, left: '-160px', bottom: '-60px',
        background: 'radial-gradient(circle, rgba(108,180,238,0.09), transparent 65%)',
        animation: 'landingFloat 14s ease-in-out infinite',
      }} />
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <span className="landing-eyebrow" style={{ marginBottom: '16px' }}>Comunidad en cifras</span>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            Estadísticas <span className="landing-gradient-text">reales</span>
          </h2>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Números que reflejan el crecimiento de nuestra comunidad
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                padding: '34px 20px',
                textAlign: 'center',
                background: 'rgba(28,28,34,0.7)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
              }}>
                <div className="skeleton" style={{ width: '60px', height: '28px', margin: '0 auto 8px' }} />
                <div className="skeleton" style={{ width: '100px', height: '14px', margin: '0 auto' }} />
              </div>
            ))
          ) : (
            statsWithValues.map((stat, i) => (
              <div
                key={i}
                className="landing-card"
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'default',
                }}
              >
                <div className="landing-spotlight" />
                <div style={{
                  width: '32px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                  margin: '0 auto 14px',
                  borderRadius: '1px',
                }} />
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  marginBottom: '6px',
                  lineHeight: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}>
                  <span className="landing-stat-value">
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  {stat.label}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
