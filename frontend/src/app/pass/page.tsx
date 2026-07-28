'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';
import { PASS_TIERS, getTierForLevel, getTierProgress, type PassTier } from '@gremio-estelar/shared';

interface RewardInfo {
  type: string;
  amount: number;
  label: string;
}

interface PassLevelItem {
  level: number;
  freeReward: RewardInfo | null;
  premiumReward: RewardInfo | null;
  isClaimed: boolean;
  isUnlocked: boolean;
}

interface TierWithLevels extends PassTier {
  levels: PassLevelItem[];
  isRevealed: boolean;
}

interface PassData {
  season: {
    name: string;
    theme: string;
    number: number;
    startsAt: string;
    endsAt: string;
  };
  userPass: {
    level: number;
    xp: number;
    isPremium: boolean;
    claimedLevels: number[];
  };
  tiers: TierWithLevels[];
  levels: PassLevelItem[];
  currentTier: PassTier;
  tierProgress: {
    currentTier: PassTier;
    nextTier: PassTier | null;
    progress: number;
  };
}

// ─── SVG Icons ───────────────────────────────────────────────

function StarIcon({ size = 14, color = '#fbbf24' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparkleSvg({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    </svg>
  );
}

function LockSvg({ size = 14, color = '#71717a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckCircle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function EyeOff({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Mystery Tier Placeholder (progressive reveal) ──────────

function MysteryTier({ tier, userLevel, onToggle }: {
  tier: TierWithLevels;
  userLevel: number;
  onToggle: () => void;
}) {
  const levelsUntilReveal = tier.revealLevel - userLevel;
  return (
    <div style={{
      borderRadius: '20px',
      border: '1px dashed rgba(255,255,255,0.1)',
      background: 'rgba(0,0,0,0.3)',
      overflow: 'hidden',
      opacity: 0.7,
      transition: 'all 0.3s ease',
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '18px 24px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Mystery icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          ❓
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#555', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ???
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '2px' }}>
            {levelsUntilReveal > 0
              ? `Se revela al alcanzar el nivel ${tier.revealLevel} (te faltan ${levelsUntilReveal} niveles)`
              : '¡Sigue subiendo para revelar este rango!'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '4px 10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.7rem', color: '#666', fontWeight: 600,
          }}>
            <EyeOff size={12} />
            <span>Oculto</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tier Card Component ─────────────────────────────────────

function TierCard({
  tier,
  userLevel,
  isPremium,
  isExpanded,
  onToggle,
  claimingLevel,
  onClaim,
}: {
  tier: TierWithLevels;
  userLevel: number;
  isPremium: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  claimingLevel: number | null;
  onClaim: (levelNumber: number) => void;
}) {
  const isUnlocked = userLevel >= tier.minLevel;
  const isActive = userLevel >= tier.minLevel && userLevel <= tier.maxLevel;
  const isComplete = userLevel > tier.maxLevel;
  const levelsInTier = tier.levels;
  const claimedInTier = levelsInTier.filter(l => l.isClaimed).length;
  const totalInTier = levelsInTier.length;

  const statusColor = isComplete ? '#22c55e' : isActive ? tier.color : '#52525b';
  const statusLabel = isComplete ? 'Completado' : isActive ? 'Activo' : 'Bloqueado';
  const statusIcon = isComplete ? '✓' : isActive ? '◉' : '✕';

  return (
    <div style={{
      borderRadius: '20px',
      border: `1px solid ${isActive ? tier.color + '66' : isComplete ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.06)'}`,
      background: isActive
        ? `linear-gradient(135deg, ${tier.color}11, rgba(255,255,255,0.02))`
        : isComplete
        ? 'rgba(34, 197, 94, 0.03)'
        : 'rgba(0,0,0,0.25)',
      boxShadow: isActive ? `0 0 30px ${tier.color}22` : 'none',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      opacity: isUnlocked ? 1 : 0.7,
    }}>
      {/* TIER HEADER */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '18px 24px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Tier Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: isUnlocked ? tier.gradient : '#222',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0,
          boxShadow: isActive ? `0 0 20px ${tier.glowColor}` : 'none',
          transition: 'box-shadow 0.3s',
        }}>
          {tier.icon}
        </div>

        {/* Tier Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: isUnlocked ? tier.color : '#71717a' }}>
              {tier.name}
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              padding: '2px 10px', borderRadius: '20px',
              background: isComplete ? 'rgba(34, 197, 94, 0.15)' : isActive ? `${tier.color}22` : 'rgba(255,255,255,0.04)',
              color: statusColor,
              border: `1px solid ${statusColor}44`,
              letterSpacing: '0.03em',
            }}>
              {statusIcon} {statusLabel}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#a1a1aa', marginTop: '2px' }}>
            {isActive
              ? `Nivel ${userLevel} — ${levelsInTier[levelsInTier.length - 1]?.level === userLevel ? 'Último nivel de este rango' : `Sigue subiendo en ${tier.name}`}`
              : isComplete
              ? `${totalInTier} niveles completados — ${claimedInTier}/${totalInTier} recompensas reclamadas`
              : `Niveles ${tier.minLevel}-${tier.maxLevel} — Desbloquea al alcanzar el nivel ${tier.minLevel}`}
          </div>
        </div>

        {/* Rewards claimed badge + Expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isUnlocked && (
            <div style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa',
              padding: '4px 10px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <StarIcon size={11} color={tier.color} />
              <span>{claimedInTier}/{totalInTier}</span>
            </div>
          )}
          <div style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            color: '#666', display: 'inline-flex',
          }}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* LEVELS (Collapsible) */}
      <div style={{
        maxHeight: isExpanded ? '1200px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        opacity: isExpanded ? 1 : 0,
      }}>
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {levelsInTier.map((lvl) => {
            const isLvlActive = userLevel === lvl.level;
            return (
              <div
                key={lvl.level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: isLvlActive
                    ? `${tier.color}15`
                    : lvl.isUnlocked
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.2)',
                  border: isLvlActive
                    ? `1px solid ${tier.color}55`
                    : lvl.isUnlocked
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(255,255,255,0.02)',
                  opacity: lvl.isUnlocked ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                {/* Level Number */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: lvl.isUnlocked ? tier.gradient : '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.9rem',
                  color: lvl.isUnlocked ? '#fff' : '#444',
                  flexShrink: 0,
                  boxShadow: isLvlActive ? `0 0 12px ${tier.glowColor}` : 'none',
                }}>
                  {lvl.level}
                </div>

                {/* Rewards */}
                <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                  {/* Free */}
                  <div style={{
                    flex: 1, padding: '8px 12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    minWidth: 0,
                  }}>
                    <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Gratuito
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ddd', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{lvl.freeReward?.label?.replace(/\s*[⭐✨🌟🌸]\s*/g, '') || '—'}</span>
                      {lvl.freeReward?.type === 'stardust' && <StarIcon size={11} color="#fbbf24" />}
                    </div>
                  </div>

                  {/* Premium */}
                  <div style={{
                    flex: 1, padding: '8px 12px', borderRadius: '10px',
                    background: isPremium ? `${tier.color}08` : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isPremium ? tier.color + '33' : 'rgba(255,255,255,0.02)'}`,
                    minWidth: 0,
                  }}>
                    <div style={{ fontSize: '0.62rem', color: isPremium ? tier.color : '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <SparkleSvg size={10} color={isPremium ? tier.color : '#666'} />
                      <span>Premium</span>
                      {!isPremium && <LockSvg size={10} color="#666" />}
                    </div>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 600,
                      color: isPremium ? tier.color : '#555', marginTop: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span>{lvl.premiumReward?.label?.replace(/\s*[⭐✨🌟🌸]\s*/g, '') || '—'}</span>
                      {lvl.premiumReward?.type === 'stardust' && <StarIcon size={11} color={tier.color} />}
                    </div>
                  </div>
                </div>

                {/* Claim Button */}
                <div style={{ minWidth: '100px', textAlign: 'right' }}>
                  {lvl.isClaimed ? (
                    <span style={{
                      fontSize: '0.72rem', color: '#22c55e', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      <CheckCircle size={14} /> Reclamado
                    </span>
                  ) : lvl.isUnlocked ? (
                    <button
                      disabled={claimingLevel === lvl.level}
                      onClick={(e) => { e.stopPropagation(); onClaim(lvl.level); }}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', border: 'none',
                        background: tier.gradient,
                        color: '#000', fontWeight: 800, fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: `0 0 15px ${tier.glowColor}`,
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        transition: 'all 0.15s',
                        opacity: claimingLevel === lvl.level ? 0.6 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <SparkleSvg size={12} color="#000" />
                      Reclamar
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <LockSvg size={11} color="#444" /> Bloqueado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function StellarPassPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PASS_TIERS.forEach(t => { initial[t.id] = false; });
    return initial;
  });

  const loadPass = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/ecosystem/pass');
      if (res?.data) {
        setData(res.data);
        // Auto-expand current tier
        const currentTierId = res.data.currentTier?.id;
        if (currentTierId) {
          setExpandedTiers(prev => ({ ...prev, [currentTierId]: true }));
        }
      }
    } catch (err) {
      console.error('Error loading Stellar Pass:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPass();
  }, [user]);

  const handleClaim = async (levelNumber: number) => {
    setClaimingLevel(levelNumber);
    try {
      const res = await apiFetch('/ecosystem/pass/claim', {
        method: 'POST',
        body: JSON.stringify({ level: levelNumber }),
      });
      showToast(res.data?.message || '¡Recompensa reclamada!', 'success');
      await loadPass();
    } catch (err: any) {
      showToast(err?.message || 'Error al reclamar nivel', 'error');
    } finally {
      setClaimingLevel(null);
    }
  };

  const toggleTier = (tierId: string) => {
    setExpandedTiers(prev => ({ ...prev, [tierId]: !prev[tierId] }));
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#fff' }}>
        <h2>Inicia sesión para acceder al Pase Estelar</h2>
        <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Ir a Iniciar Sesión</Link>
      </div>
    );
  }

  const currentTier = data?.currentTier;
  const tierProgress = data?.tierProgress;
  const cleanSeasonName = data?.season?.name ? data.season.name.replace(/\s*[⭐✨🌟🌸]\s*/g, '') : 'Pase Estelar';

  return (
    <ClientOnly>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', color: '#fff' }}>
        {/* ──────────────────────── HERO BANNER ──────────────────────── */}
        <div style={{
          position: 'relative',
          padding: '40px 32px',
          borderRadius: '24px',
          background: currentTier
            ? `linear-gradient(135deg, ${currentTier.color}22, rgba(147, 51, 234, 0.15), rgba(15, 23, 42, 0.95))`
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(147, 51, 234, 0.25), rgba(15, 23, 42, 0.95))',
          border: currentTier ? `1px solid ${currentTier.color}55` : '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: currentTier ? `0 20px 40px ${currentTier.glowColor}` : '0 20px 40px rgba(0,0,0,0.5)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          {currentTier && (
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: '240px', height: '240px', borderRadius: '50%',
              background: currentTier.glowColor,
              filter: 'blur(80px)',
              pointerEvents: 'none',
            }} />
          )}

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '999px',
              background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.4)',
              color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800, marginBottom: '12px',
            }}>
              <StarIcon size={12} color="#fbbf24" /> TEMPORADA ACTIVA
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cleanSeasonName}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted, #a1a1aa)', fontSize: '0.95rem' }}>
              Progresa con tus misiones y publicaciones para subir de rango y desbloquear recompensas exclusivas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
            {/* Current Tier Badge */}
            {currentTier && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 18px', borderRadius: '16px',
                background: `linear-gradient(135deg, ${currentTier.color}22, ${currentTier.color}11)`,
                border: `1px solid ${currentTier.color}55`,
              }}>
                <span style={{ fontSize: '1.8rem' }}>{currentTier.icon}</span>
                <div>
                  <div style={{ fontSize: '0.68rem', color: currentTier.color, fontWeight: 700, textTransform: 'uppercase' }}>
                    Rango Actual
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: currentTier.color }}>
                    {currentTier.name}
                  </div>
                </div>
              </div>
            )}

            {/* Pass Status */}
            <div style={{
              padding: '10px 18px', borderRadius: '16px',
              background: data?.userPass.isPremium
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.35))'
                : 'rgba(255,255,255,0.06)',
              border: data?.userPass.isPremium ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: '0.68rem', color: data?.userPass.isPremium ? '#fbbf24' : 'var(--text-muted, #a1a1aa)', textTransform: 'uppercase', fontWeight: 700 }}>
                Pase
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: data?.userPass.isPremium ? '#fbbf24' : '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {data?.userPass.isPremium ? (
                  <><SparkleSvg size={14} color="#fbbf24" /> Premium</>
                ) : 'Gratuito'}
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────── TIER ROADMAP ──────────────────────── */}
        {data && (
          <div style={{
            marginBottom: '28px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                🏆 Progresión de Rangos
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>
                Nivel {data.userPass.level} / 50
              </span>
            </div>

            {/* Roadmap step indicators */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}>
              {data.tiers.map((tier, idx) => {
                const isTierUnlocked = data.userPass.level >= tier.minLevel;
                const isTierActive = data.userPass.level >= tier.minLevel && data.userPass.level <= tier.maxLevel;
                const isHidden = !tier.isRevealed;
                return (
                  <div key={tier.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: '120px',
                  }}>
                    {/* Connector line */}
                    {idx > 0 && (
                      <div style={{
                        flex: 1,
                        height: '3px',
                        borderRadius: '2px',
                        background: isTierUnlocked ? tier.color + '66' : isHidden ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                        marginRight: '4px',
                      }} />
                    )}

                    {/* Tier node */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '14px',
                      background: isTierActive
                        ? `${tier.color}18`
                        : isTierUnlocked
                        ? 'rgba(255,255,255,0.03)'
                        : isHidden
                        ? 'rgba(0,0,0,0.2)'
                        : 'transparent',
                      border: isTierActive
                        ? `1.5px solid ${tier.color}77`
                        : isHidden
                        ? '1px dashed rgba(255,255,255,0.06)'
                        : '1px solid rgba(255,255,255,0.04)',
                      cursor: isHidden ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                      onClick={() => { if (!isHidden) toggleTier(tier.id); }}
                      onMouseEnter={e => { if (!isHidden) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { if (!isHidden) e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <span style={{
                        fontSize: '1.4rem',
                        filter: tier.isRevealed ? 'none' : 'grayscale(1) opacity(0.3)',
                        transition: 'filter 0.3s',
                      }}>
                        {tier.isRevealed ? tier.icon : '❓'}
                      </span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        color: isTierActive ? tier.color : isTierUnlocked ? '#aaa' : '#444',
                        textTransform: 'uppercase',
                      }}>
                        {tier.isRevealed ? tier.name : '???'}
                      </span>
                      <span style={{
                        fontSize: '0.6rem', color: '#666',
                      }}>
                        {tier.isRevealed ? `Lv.${tier.minLevel}-${tier.maxLevel}` : '🔒'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────────────── LEVEL STATS BAR ──────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '16px 24px', marginBottom: '24px',
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Nivel Actual</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: currentTier?.color || '#38bdf8' }}>
              Nivel {data?.userPass.level || 1}
            </div>
          </div>

          {/* Tier progress inside current tier */}
          {tierProgress && (
            <div style={{ flex: 1, maxWidth: '280px', margin: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: tierProgress.currentTier.color, fontWeight: 700 }}>
                  {tierProgress.currentTier.name}
                </span>
                {tierProgress.nextTier && (
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>
                    → {tierProgress.nextTier.name}
                  </span>
                )}
              </div>
              <div style={{
                width: '100%', height: '6px', borderRadius: '3px',
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${tierProgress.progress}%`,
                  background: tierProgress.currentTier.gradient,
                  transition: 'width 0.5s ease',
                  boxShadow: `0 0 8px ${tierProgress.currentTier.glowColor}`,
                }} />
              </div>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Recompensas Reclamadas</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
              {data?.userPass.claimedLevels.length || 0} / 50
            </div>
          </div>
        </div>

        {/* ──────────────────────── CURRENT TIER SPOTLIGHT ──────────────────────── */}
        {currentTier && (
          <div style={{
            padding: '24px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${currentTier.color}18, ${currentTier.color}08, rgba(255,255,255,0.01))`,
            border: `1px solid ${currentTier.color}44`,
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: currentTier.glowColor,
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: currentTier.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: `0 0 30px ${currentTier.glowColor}`,
              }}>
                {currentTier.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: currentTier.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rango Actual
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '2px 0' }}>
                  {currentTier.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                  {tierProgress?.nextTier
                    ? `Completa los niveles ${currentTier.minLevel}-${currentTier.maxLevel} para alcanzar ${tierProgress.nextTier.icon} ${tierProgress.nextTier.name}`
                    : '¡Has alcanzado el rango más alto! Sigue desbloqueando recompensas.'}
                </div>
              </div>
              {/* Premium upsell */}
              {!data?.userPass.isPremium && (
                <Link href="/premium" style={{
                  padding: '10px 18px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#000', fontWeight: 800, fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)',
                  whiteSpace: 'nowrap',
                }}>
                  <SparkleSvg size={14} color="#000" />
                  Activar Premium
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────── TIER SECTIONS ──────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⭐</div>
            <div>Cargando Pase Estelar...</div>
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.tiers.map((tier) => (
              tier.isRevealed ? (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  userLevel={data.userPass.level}
                  isPremium={data.userPass.isPremium}
                  isExpanded={!!expandedTiers[tier.id]}
                  onToggle={() => toggleTier(tier.id)}
                  claimingLevel={claimingLevel}
                  onClaim={handleClaim}
                />
              ) : (
                <MysteryTier
                  key={tier.id}
                  tier={tier}
                  userLevel={data.userPass.level}
                  onToggle={() => toggleTier(tier.id)}
                />
              )
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No se pudo cargar el pase. Intenta de nuevo más tarde.
          </div>
        )}
      </div>
    </ClientOnly>
  );
}
