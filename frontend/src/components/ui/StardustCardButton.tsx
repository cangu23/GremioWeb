'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import UserAvatar from '@/components/ui/UserAvatar';

interface StardustCardButtonProps {
  onClick: () => void;
  isMobile?: boolean;
}

export default function StardustCardButton({ onClick, isMobile = false }: StardustCardButtonProps) {
  const { user } = useAuth();
  const [stardust, setStardust] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStardust = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/ecosystem/stardust');
      if (res?.data) {
        setStardust(res.data.stardust || 0);
        setMultiplier(res.data.multiplier || 1);
      }
    } catch {
      // Keep previous or default
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStardust();
    const handleUpdate = () => fetchStardust();
    window.addEventListener('stardust-updated', handleUpdate);
    return () => window.removeEventListener('stardust-updated', handleUpdate);
  }, [fetchStardust]);

  if (!user) return null;

  const avatarUrl = user.avatarUrl || user.vtuberProfile?.avatarUrl || '';
  const displayName = user.displayName || user.vtuberProfile?.displayName || user.username;

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(139,92,246,0.12))',
          border: '1px solid rgba(245,158,11,0.35)',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(245,158,11,0.15)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer sweep effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            animation: 'stardustShimmer 3.5s infinite',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserAvatar src={avatarUrl} alt={displayName} size={30} user={user} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⭐ {stardust.toLocaleString()}</span>
              {multiplier > 1 && (
                <span style={{ fontSize: '0.65rem', background: '#f59e0b', color: '#000', padding: '1px 5px', borderRadius: '6px', fontWeight: 900 }}>
                  ×{multiplier.toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estadísticas y Misiones Stardust</div>
          </div>
        </div>

        <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 800 }}>→</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      title="Ver estadísticas, misiones y transferencias de Stardust"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px 4px 5px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(139,92,246,0.14) 100%)',
        border: '1px solid rgba(245,158,11,0.38)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.7)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.38)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.15)';
      }}
    >
      {/* Background ambient glow pulse */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(245,158,11,0.25), transparent 70%)',
          pointerEvents: 'none',
          animation: 'stardustPulse 3s ease-in-out infinite alternate',
        }}
      />

      {/* Shimmer light bar overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          animation: 'stardustShimmer 4s infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Profile Avatar */}
      <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
        <UserAvatar src={avatarUrl} alt={displayName} size={26} user={user} />
      </div>

      {/* Star Icon + Stardust Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', zIndex: 1 }}>
        <span
          style={{
            fontSize: '0.95rem',
            filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.8))',
            animation: 'stardustFloat 2.5s ease-in-out infinite alternate',
            display: 'inline-block',
          }}
        >
          ⭐
        </span>

        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', letterSpacing: '0.01em' }}>
          {loading ? '...' : stardust.toLocaleString()}
        </span>

        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f59e0b' }}>
          Stardust
        </span>

        {multiplier > 1 && (
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '1px 5px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              boxShadow: '0 0 8px rgba(245,158,11,0.5)',
              marginLeft: '2px',
            }}
          >
            ×{multiplier.toFixed(1)}
          </span>
        )}
      </div>
    </button>
  );
}
