'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Star, Users, Rocket, ExternalLink } from '@/components/ui/Icons';
import { useAuth } from '@/lib/AuthContext';
import { hasAnyRole } from '@gremio-estelar/shared';

interface VTuberStatsHeaderProps {
  totalVtubers: number;
  liveCount: number;
  featuredCount: number;
}

export default function VTuberStatsHeader({ totalVtubers, liveCount, featuredCount }: VTuberStatsHeaderProps) {
  const { user } = useAuth();
  const isVtuber = hasAnyRole(user?.role, ['VTUBER', 'ADMIN', 'STAFF']);

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--primary-hover)',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={14} color="var(--primary-hover)" />
            DIRECTORIO ESTELAR DE VTUBERS
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 40%, var(--primary-hover) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Creadores & VTubers del Gremio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '6px 0 0 0', maxWidth: '600px' }}>
            Explora perfiles oficiales, transmisiones en directo e identidades estelares de nuestra comunidad.
          </p>
        </div>

        {/* CTA Button */}
        {user ? (
          <Link
            href={isVtuber ? '/vtuber-profile' : '/notifications'}
            style={{
              padding: '12px 22px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(139, 92, 246, 0.35)',
              transition: 'transform 0.2s ease',
            }}
          >
            <Rocket size={16} color="#fff" />
            <span>{isVtuber ? 'Mi Perfil VTuber' : 'Solicitar Perfil VTuber'}</span>
          </Link>
        ) : (
          <Link
            href="/register"
            style={{
              padding: '12px 22px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s ease',
            }}
          >
            <Users size={16} color="var(--primary-hover)" />
            <span>Únete al Gremio</span>
          </Link>
        )}
      </div>

      {/* Grid of Stat Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Stat 1: Total VTubers */}
        <div
          className="glass"
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(22, 22, 32, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} color="var(--primary-hover)" />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{totalVtubers}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              VTubers Registrados
            </div>
          </div>
        </div>

        {/* Stat 2: Live streams */}
        <div
          className="glass"
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: liveCount > 0 ? 'rgba(233, 30, 99, 0.08)' : 'rgba(22, 22, 32, 0.6)',
            border: liveCount > 0 ? '1px solid rgba(233, 30, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: liveCount > 0 ? '0 0 20px rgba(233, 30, 99, 0.1)' : 'none',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: liveCount > 0 ? 'rgba(233, 30, 99, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: liveCount > 0 ? '#ff4081' : 'var(--text-muted)',
                boxShadow: liveCount > 0 ? '0 0 10px #ff4081' : 'none',
                animation: liveCount > 0 ? 'vtuber-pulse-dot 1.4s infinite ease-in-out' : 'none',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: liveCount > 0 ? '#ff4081' : '#fff', lineHeight: 1.1 }}>
              {liveCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: liveCount > 0 ? '#ff80ab' : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {liveCount === 1 ? 'Transmisión En Vivo' : 'Transmisiones En Vivo'}
            </div>
          </div>
        </div>

        {/* Stat 3: Featured VIP */}
        <div
          className="glass"
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(22, 22, 32, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Star size={22} color="#f59e0b" fill="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{featuredCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              VTubers Destacados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
