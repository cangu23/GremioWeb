'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

interface Mission {
  id: string;
  completed: boolean;
  claimedAt: string | null;
}

function StarIcon({ size = 14, color = '#fbbf24' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparklesIcon({ size = 13, color = '#38bdf8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

export default function StardustProgressBar() {
  const { user } = useAuth();
  const [stardust, setStardust] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(6);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [stardustRes, missionsRes] = await Promise.all([
          apiFetch('/ecosystem/stardust').catch(() => null),
          apiFetch('/ecosystem/missions').catch(() => null),
        ]);

        if (stardustRes?.data) {
          setStardust(stardustRes.data.stardust || 0);
          setMultiplier(stardustRes.data.multiplier || 1);
        }
        if (missionsRes?.data) {
          const list: Mission[] = missionsRes.data;
          setTotalCount(list.length || 6);
          const done = list.filter(m => m.completed || !!m.claimedAt).length;
          setCompletedCount(done);
        }
      } catch (err) {
        console.error('Error loading progress bar data:', err);
      }
    };
    loadData();
  }, [user]);

  if (!user) return null;

  const pct = Math.min(100, Math.round((completedCount / (totalCount || 1)) * 100));

  return (
    <div
      className="glass"
      style={{
        padding: '12px 18px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(138,43,226,0.05))',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '14px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* LEFT: STARDUST BADGE & LEVEL PROGRESS */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          color: '#fbbf24',
          fontSize: '0.82rem',
          fontWeight: 800,
          flexShrink: 0,
        }}>
          <StarIcon size={13} color="#fbbf24" />
          <span>{stardust} Stardust</span>
          {multiplier > 1 && (
            <span style={{ fontSize: '0.65rem', background: '#fbbf24', color: '#000', padding: '0 4px', borderRadius: '4px' }}>
              ×{multiplier}
            </span>
          )}
        </div>

        {/* COMPACT PROGRESS BAR */}
        <div style={{ flex: 1, minWidth: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted, #a1a1aa)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <SparklesIcon size={11} color="#38bdf8" /> Misiones Diarias
            </span>
            <span style={{ fontWeight: 700, color: completedCount === totalCount ? '#00e676' : '#38bdf8' }}>
              {completedCount}/{totalCount} completadas
            </span>
          </div>

          <div style={{
            height: '6px',
            width: '100%',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: completedCount === totalCount
                ? 'linear-gradient(90deg, #00e676, #00c853)'
                : 'linear-gradient(90deg, #38bdf8, #c084fc)',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* RIGHT: LINK TO PASE ESTELAR */}
      <Link
        href="/pass"
        style={{
          padding: '6px 14px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
          fontSize: '0.78rem',
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      >
        <span>Pase Estelar</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}
