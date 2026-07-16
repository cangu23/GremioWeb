'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PlatformStats {
  totalVtubers: number;
  totalEvents: number;
  totalGuilds: number;
  totalMessages: number;
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
  { value: 0, suffix: '+', label: 'Mensajes Enviados', key: 'totalMessages' },
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
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="container">
        <div className="section-accent-line" />
        <h2 className="section-title">Estadísticas</h2>
        <p className="section-subtitle">
          Números que reflejan el crecimiento de nuestra comunidad
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                padding: '32px 20px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: '12px',
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
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.borderColor = 'rgba(230,57,70,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '2px',
                  background: 'var(--primary)',
                  margin: '0 auto 12px',
                  borderRadius: '1px',
                }} />
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  lineHeight: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
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
