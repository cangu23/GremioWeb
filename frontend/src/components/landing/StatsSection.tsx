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
  icon: string;
  key: keyof PlatformStats;
}

const statConfigs: StatDisplay[] = [
  { value: 0, suffix: '+', label: 'VTubers Registrados', icon: '', key: 'totalVtubers' },
  { value: 0, suffix: '+', label: 'Eventos Realizados', icon: '', key: 'totalEvents' },
  { value: 0, suffix: '+', label: 'Gremios Creados', icon: '', key: 'totalGuilds' },
  { value: 0, suffix: '+', label: 'Mensajes Enviados', icon: '', key: 'totalMessages' },
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

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/stats', {});
        setStats(data);
      } catch {
        // Silently fail — stats section just won't animate
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
          {loading ? (
            // Skeleton loading state
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'var(--card-bg)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    margin: '0 auto 12px',
                  }}
                />
                <div
                  style={{
                    width: '80px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    margin: '0 auto 8px',
                  }}
                />
                <div
                  style={{
                    width: '100px',
                    height: '16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    margin: '0 auto',
                  }}
                />
              </div>
            ))
          ) : (
            statsWithValues.map((stat, i) => (
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
                <div style={{ width: '28px', height: '3px', borderRadius: '2px', background: 'var(--primary)', margin: '0 auto 16px' }} />
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
            ))
          )}
        </div>
      </div>
    </section>
  );
}
