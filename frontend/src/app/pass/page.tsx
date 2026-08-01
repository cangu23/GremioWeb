'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { PASS_TIERS, type PassTier } from '@gremio-estelar/shared';

// ─── Interfaces ───────────────────────────────────────────────

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

interface MissionItem {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  action: string;
  xpReward: number;
  stardustReward: number;
  currentProgress: number;
  completed: boolean;
  claimedAt: string | null;
}

interface StreakDay {
  day: number;
  stardust: number;
  xp: number;
  isChest?: boolean;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface StreakData {
  currentStreak: number;
  hasCheckedInToday: boolean;
  days: StreakDay[];
}

interface CommunityChallenge {
  title: string;
  description: string;
  goal: number;
  currentProgress: number;
  progressPct: number;
  completed: boolean;
  rewardStardust: number;
  rewardXp: number;
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

function TargetIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
    </svg>
  );
}

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ─── Canvas Confetti Effect ──────────────────────────────────

function triggerConfettiBurst() {
  if (typeof window === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#fbbf24', '#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#ffffff'];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotSpeed: number;
    alpha: number;
  }> = [];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 3,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 18,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
    });
  }

  let animationId: number;
  const startTime = Date.now();

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.015;

      if (p.alpha > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active && Date.now() - startTime < 3000) {
      animationId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  render();
}

// ─── Mystery Chest Lootbox Modal ──────────────────────────────

function MysteryChestModal({
  isOpen,
  onClose,
  rewardData,
}: {
  isOpen: boolean;
  onClose: () => void;
  rewardData: { message: string; stardustAmount?: number; xpAmount?: number; frameGranted?: string | null } | null;
}) {
  if (!isOpen || !rewardData) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: '20px',
    }}>
      <div style={{
        maxWidth: '440px', width: '100%',
        background: 'linear-gradient(135deg, #18181b, #090d16)',
        border: '1px solid rgba(251, 191, 36, 0.5)',
        boxShadow: '0 0 50px rgba(251, 191, 36, 0.3)',
        borderRadius: '24px', padding: '32px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {/* Chest Glow */}
        <div style={{
          fontSize: '4.5rem', marginBottom: '16px',
          filter: 'drop-shadow(0 0 20px #fbbf24)',
          animation: 'bounce 1s infinite alternate ease-in-out',
        }}>
          🎁
        </div>

        <div style={{
          fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px',
        }}>
          ¡COFRE MISTERIOSO ESTELAR ABIERTO!
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
          {rewardData.message}
        </h3>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
          margin: '20px 0',
        }}>
          {rewardData.stardustAmount && rewardData.stardustAmount > 0 && (
            <div style={{
              padding: '10px 18px', borderRadius: '14px',
              background: 'rgba(251, 191, 36, 0.15)', border: '1px solid #fbbf24',
              color: '#fbbf24', fontWeight: 900, fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <StarIcon size={18} color="#fbbf24" />
              <span>+{rewardData.stardustAmount} ⭐</span>
            </div>
          )}

          {rewardData.xpAmount && rewardData.xpAmount > 0 && (
            <div style={{
              padding: '10px 18px', borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8',
              color: '#38bdf8', fontWeight: 900, fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>⚡ +{rewardData.xpAmount} XP</span>
            </div>
          )}

          {rewardData.frameGranted && (
            <div style={{
              padding: '10px 18px', borderRadius: '14px',
              background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7',
              color: '#c084fc', fontWeight: 900, fontSize: '1rem',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>🖼️ Marco: {rewardData.frameGranted}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#000', fontWeight: 900, fontSize: '0.95rem',
            cursor: 'pointer', boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
          }}
        >
          ¡Aceptar Recompensas! ✨
        </button>
      </div>
    </div>
  );
}

// ─── Mystery Tier Placeholder ─────────────────────────────────

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
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ???
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
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

      {/* LEVELS LIST */}
      <div style={{
        maxHeight: isExpanded ? '1200px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        opacity: isExpanded ? 1 : 0,
      }}>
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {levelsInTier.map((lvl) => {
            const isLvlActive = userLevel === lvl.level;
            const isChestLevel = [5, 15, 25, 35, 45].includes(lvl.level);
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

                <div style={{ flex: 1, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Free reward */}
                  <div style={{
                    flex: 1, minWidth: '130px', padding: '8px 12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Gratuito {isChestLevel && '🎁 Cofre'}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ddd', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{isChestLevel ? '🎁 Cofre Misterioso Estelar' : (lvl.freeReward?.label?.replace(/\s*[⭐✨🌟🌸]\s*/g, '') || '—')}</span>
                      {lvl.freeReward?.type === 'stardust' && !isChestLevel && <StarIcon size={11} color="#fbbf24" />}
                    </div>
                  </div>

                  {/* Premium reward */}
                  <div style={{
                    flex: 1, minWidth: '130px', padding: '8px 12px', borderRadius: '10px',
                    background: isPremium ? `${tier.color}08` : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isPremium ? tier.color + '33' : 'rgba(255,255,255,0.02)'}`,
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
                        transition: 'transform 0.15s',
                        opacity: claimingLevel === lvl.level ? 0.6 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
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

// ─── Main Page Component ──────────────────────────────────────

export default function StellarPassPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pass' | 'missions'>('pass');
  const [data, setData] = useState<PassData | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [communityChallenge, setCommunityChallenge] = useState<CommunityChallenge | null>(null);

  const [loading, setLoading] = useState(true);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [buyingPremium, setBuyingPremium] = useState(false);
  const [skippingLevel, setSkippingLevel] = useState(false);

  // Chest lootbox modal state
  const [chestModalOpen, setChestModalOpen] = useState(false);
  const [chestReward, setChestReward] = useState<{ message: string; stardustAmount?: number; xpAmount?: number; frameGranted?: string | null } | null>(null);

  // FOMO Countdown Timer to UTC Midnight
  const [timeToReset, setTimeToReset] = useState<string>('');

  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PASS_TIERS.forEach(t => { initial[t.id] = false; });
    return initial;
  });

  // Calculate live countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setUTCHours(24, 0, 0, 0);

      const diffMs = nextReset.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeToReset('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeToReset(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadPass = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/ecosystem/pass');
      if (res?.data) {
        setData(res.data);
        const currentTierId = res.data.currentTier?.id;
        if (currentTierId) {
          setExpandedTiers(prev => ({ ...prev, [currentTierId]: true }));
        }
      }
    } catch (err) {
      console.error('Error loading Stellar Pass:', err);
    }
  };

  const loadMissions = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/ecosystem/missions');
      if (res?.data) setMissions(res.data);
    } catch (err) {
      console.error('Error loading missions:', err);
    }
  };

  const loadStreak = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/ecosystem/streak');
      if (res?.data) setStreakData(res.data);
    } catch (err) {
      console.error('Error loading streak:', err);
    }
  };

  const loadCommunityChallenge = async () => {
    try {
      const res = await apiFetch('/ecosystem/community-challenge');
      if (res?.data) setCommunityChallenge(res.data);
    } catch (err) {
      console.error('Error loading community challenge:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([loadPass(), loadMissions(), loadStreak(), loadCommunityChallenge()]).finally(() => setLoading(false));
    }
  }, [user]);

  const handleClaim = async (levelNumber: number) => {
    setClaimingLevel(levelNumber);
    try {
      // Check if it's a lootbox level
      const isChest = [5, 15, 25, 35, 45].includes(levelNumber);

      const res = await apiFetch('/ecosystem/pass/claim', {
        method: 'POST',
        body: JSON.stringify({ level: levelNumber }),
      });

      triggerConfettiBurst();

      if (isChest) {
        // Trigger lootbox open
        const chestRes = await apiFetch('/ecosystem/chest/open', { method: 'POST' });
        if (chestRes?.data) {
          setChestReward(chestRes.data);
          setChestModalOpen(true);
        }
      } else {
        showToast(res.data?.message || '¡Recompensa reclamada!', 'success');
      }

      await loadPass();
    } catch (err: any) {
      showToast(err?.message || 'Error al reclamar nivel', 'error');
    } finally {
      setClaimingLevel(null);
    }
  };

  const handleClaimAllPass = async () => {
    setClaimingAll(true);
    try {
      const res = await apiFetch('/ecosystem/pass/claim-all', { method: 'POST' });
      triggerConfettiBurst();
      showToast(res.data?.message || '¡Todas las recompensas del pase fueron reclamadas!', 'success');
      await loadPass();
    } catch (err: any) {
      showToast(err?.message || 'No hay recompensas pendientes', 'info');
    } finally {
      setClaimingAll(false);
    }
  };

  const handleClaimMission = async (missionId: string) => {
    setClaimingMissionId(missionId);
    try {
      const res = await apiFetch(`/ecosystem/missions/${missionId}/claim`, { method: 'POST' });
      triggerConfettiBurst();
      showToast(res.data?.message || '¡Misión reclamada!', 'success');
      await loadMissions();
      await loadPass();
      await loadStreak();
    } catch (err: any) {
      showToast(err?.message || 'Error al reclamar misión', 'error');
    } finally {
      setClaimingMissionId(null);
    }
  };

  const handleClaimAllMissions = async () => {
    setClaimingAll(true);
    try {
      const res = await apiFetch('/ecosystem/missions/claim-all', { method: 'POST' });
      triggerConfettiBurst();
      showToast(res.data?.message || '¡Todas las misiones fueron reclamadas!', 'success');
      await loadMissions();
      await loadPass();
      await loadStreak();
    } catch (err: any) {
      showToast(err?.message || 'No hay misiones completadas pendientes', 'info');
    } finally {
      setClaimingAll(false);
    }
  };

  const handleBuyPremiumWithStardust = async () => {
    if (!window.confirm('¿Deseas activar el Pase Estelar Premium VIP por 2,500 ⭐ Polvo Estelar para la temporada activa?')) {
      return;
    }
    setBuyingPremium(true);
    try {
      const res = await apiFetch('/ecosystem/pass/buy-premium', { method: 'POST' });
      triggerConfettiBurst();
      showToast(res.data?.message || '¡Pase Premium VIP activado!', 'success');
      window.dispatchEvent(new Event('stardust-updated'));
      await loadPass();
    } catch (err: any) {
      showToast(err?.message || 'No se pudo comprar el Pase Premium. Verifica que tengas al menos 2,500 ⭐ Polvo Estelar.', 'error');
    } finally {
      setBuyingPremium(false);
    }
  };

  const handleSkipLevelWithStardust = async () => {
    setSkippingLevel(true);
    try {
      const res = await apiFetch('/ecosystem/pass/skip-level', { method: 'POST' });
      triggerConfettiBurst();
      showToast(res.data?.message || '¡Nivel avanzado con éxito!', 'success');
      await loadPass();
    } catch (err: any) {
      showToast(err?.message || 'Error al saltar nivel', 'error');
    } finally {
      setSkippingLevel(false);
    }
  };

  const toggleTier = (tierId: string) => {
    setExpandedTiers(prev => ({ ...prev, [tierId]: !prev[tierId] }));
  };

  const getMissionActionInfo = (action: string) => {
    switch (action) {
      case 'POST_CREATE':
        return { label: 'Crear Publicación', href: '/', instruction: 'Publica un post, historia o clip en el muro principal de la comunidad.' };
      case 'COMMENT_CREATE':
        return { label: 'Ir al Feed y Comentar', href: '/', instruction: 'Entra a las publicaciones de otros miembros y deja al menos 3 comentarios.' };
      case 'POST_LIKE':
        return { label: 'Reaccionar en el Feed', href: '/', instruction: 'Dale me gusta (reacciona con estrellas) a 10 publicaciones o comentarios.' };
      case 'VTUBER_VISIT':
        return { label: 'Explorar VTubers', href: '/vtubers', instruction: 'Visita y explora el perfil de cualquier VTuber de la plataforma.' };
      case 'EVENT_JOIN':
        return { label: 'Ver Eventos y Constelaciones', href: '/events', instruction: 'Únete a un evento activo o explora un canal de Constelaciones.' };
      case 'DAILY_LOGIN':
        return { label: '¡Check-in Completado!', href: null, instruction: 'Esta misión se completa automáticamente al iniciar sesión hoy.' };
      default:
        return { label: 'Ir a completar', href: '/', instruction: 'Completa la acción correspondiente en la plataforma.' };
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#fff' }}>
        <h2>Inicia sesión para acceder al Pase Estelar y Hub de Misiones</h2>
        <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Ir a Iniciar Sesión</Link>
      </div>
    );
  }

  const currentTier = data?.currentTier;
  const tierProgress = data?.tierProgress;
  const cleanSeasonName = data?.season?.name ? data.season.name.replace(/\s*[⭐✨🌟🌸]\s*/g, '') : 'Pase Estelar';

  const pendingPassRewards = data?.levels.filter(l => l.isUnlocked && !l.isClaimed).length || 0;
  const pendingMissionRewards = missions.filter(m => m.completed && !m.claimedAt).length || 0;

  return (
    <ClientOnly>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', color: '#fff' }}>
        
        {/* Lootbox Chest Modal */}
        <MysteryChestModal
          isOpen={chestModalOpen}
          onClose={() => setChestModalOpen(false)}
          rewardData={chestReward}
        />

        {/* ──────────────────────── HERO BANNER ──────────────────────── */}
        <div style={{
          position: 'relative',
          padding: '36px 32px',
          borderRadius: '24px',
          background: currentTier
            ? `linear-gradient(135deg, ${currentTier.color}22, rgba(147, 51, 234, 0.2), rgba(15, 23, 42, 0.95))`
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(147, 51, 234, 0.25), rgba(15, 23, 42, 0.95))',
          border: currentTier ? `1px solid ${currentTier.color}55` : '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: currentTier ? `0 20px 40px ${currentTier.glowColor}` : '0 20px 40px rgba(0,0,0,0.5)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          overflow: 'hidden',
        }}>
          {currentTier && (
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: '240px', height: '240px', borderRadius: '50%',
              background: currentTier.glowColor,
              filter: 'blur(80px)',
              pointerEvents: 'none',
            }} />
          )}

          <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '999px',
                background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800,
              }}>
                <StarIcon size={12} color="#fbbf24" /> TEMPORADA ACTIVA
              </div>

              {/* FOMO Countdown Timer */}
              {timeToReset && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171', fontSize: '0.78rem', fontWeight: 800,
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                }}>
                  ⏱️ Reinicio en: {timeToReset}
                </div>
              )}
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, margin: 0, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cleanSeasonName}
            </h1>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.92rem', maxWidth: '600px' }}>
              Completa misiones diarias, racha de check-in y avanza en la hoja de ruta para ganar Stardust ⭐, cofres misteriosos y marcos VIP.
            </p>
          </div>

          {/* Right Header Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
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

            {!data?.userPass.isPremium ? (
              <button
                disabled={buyingPremium}
                onClick={handleBuyPremiumWithStardust}
                style={{
                  padding: '10px 18px', borderRadius: '16px', border: 'none',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#000', fontWeight: 900, fontSize: '0.85rem',
                  cursor: 'pointer', boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <SparkleSvg size={14} color="#000" />
                <span>Activar Premium VIP (2,500 ⭐)</span>
              </button>
            ) : (
              <div style={{
                padding: '10px 18px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.35))',
                border: '1px solid #fbbf24',
              }}>
                <div style={{ fontSize: '0.68rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                  Pase
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SparkleSvg size={14} color="#fbbf24" /> Premium VIP
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────── NAVIGATION TABS & ACTIONS ──────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'inline-flex', padding: '4px', borderRadius: '16px',
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              onClick={() => setActiveTab('pass')}
              style={{
                padding: '10px 22px', borderRadius: '12px', border: 'none',
                background: activeTab === 'pass'
                  ? 'linear-gradient(135deg, #38bdf8, #0284c7)'
                  : 'transparent',
                color: activeTab === 'pass' ? '#fff' : '#a1a1aa',
                fontWeight: 800, fontSize: '0.88rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <StarIcon size={15} color={activeTab === 'pass' ? '#fff' : '#a1a1aa'} />
              <span>Pase Estelar</span>
              {pendingPassRewards > 0 && (
                <span style={{
                  padding: '2px 7px', borderRadius: '99px',
                  background: '#fbbf24', color: '#000', fontSize: '0.68rem', fontWeight: 900,
                }}>
                  {pendingPassRewards}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              style={{
                padding: '10px 22px', borderRadius: '12px', border: 'none',
                background: activeTab === 'missions'
                  ? 'linear-gradient(135deg, #a855f7, #7e22ce)'
                  : 'transparent',
                color: activeTab === 'missions' ? '#fff' : '#a1a1aa',
                fontWeight: 800, fontSize: '0.88rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <TargetIcon size={15} />
              <span>Hub de Misiones & Racha</span>
              {pendingMissionRewards > 0 && (
                <span style={{
                  padding: '2px 7px', borderRadius: '99px',
                  background: '#a855f7', color: '#fff', fontSize: '0.68rem', fontWeight: 900,
                }}>
                  {pendingMissionRewards}
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Skip Level Button */}
            <button
              disabled={skippingLevel || (data?.userPass.level || 1) >= 50}
              onClick={handleSkipLevelWithStardust}
              style={{
                padding: '10px 16px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#38bdf8', fontWeight: 800, fontSize: '0.82rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              ⚡ Saltar Nivel (150 ⭐)
            </button>

            {/* Claim All Button */}
            {activeTab === 'pass' ? (
              pendingPassRewards > 0 && (
                <button
                  disabled={claimingAll}
                  onClick={handleClaimAllPass}
                  style={{
                    padding: '10px 20px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#000', fontWeight: 900, fontSize: '0.85rem',
                    cursor: 'pointer', boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <SparkleSvg size={15} color="#000" />
                  <span>Reclamar Todo ({pendingPassRewards})</span>
                </button>
              )
            ) : (
              pendingMissionRewards > 0 && (
                <button
                  disabled={claimingAll}
                  onClick={handleClaimAllMissions}
                  style={{
                    padding: '10px 20px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    color: '#fff', fontWeight: 900, fontSize: '0.85rem',
                    cursor: 'pointer', boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <SparkleSvg size={15} color="#fff" />
                  <span>Reclamar Misiones ({pendingMissionRewards})</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* ──────────────────────── TAB CONTENT: PASE ESTELAR ──────────────────────── */}
        {activeTab === 'pass' && (
          <>
            {/* TIER ROADMAP */}
            {data && (
              <div style={{
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                padding: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    🏆 Hoja de Ruta de Rangos Estelares
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>
                    Nivel {data.userPass.level} / 50
                  </span>
                </div>

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
                        {idx > 0 && (
                          <div style={{
                            flex: 1,
                            height: '3px',
                            borderRadius: '2px',
                            background: isTierUnlocked ? tier.color + '66' : isHidden ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                            marginRight: '4px',
                          }} />
                        )}

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
                        >
                          <span style={{
                            fontSize: '1.4rem',
                            filter: tier.isRevealed ? 'none' : 'grayscale(1) opacity(0.3)',
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
                          <span style={{ fontSize: '0.6rem', color: '#666' }}>
                            {tier.isRevealed ? `Lv.${tier.minLevel}-${tier.maxLevel}` : '🔒'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LEVEL STATS BAR */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '16px 24px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Nivel Actual del Pase</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: currentTier?.color || '#38bdf8' }}>
                  Nivel {data?.userPass.level || 1}
                </div>
              </div>

              {tierProgress && (
                <div style={{ flex: 1, maxWidth: '280px', margin: '0 12px' }}>
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

            {/* TIER CARDS LIST */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#a1a1aa' }}>
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
            ) : null}
          </>
        )}

        {/* ──────────────────────── TAB CONTENT: HUB DE MISIONES & RACHA ──────────────────────── */}
        {activeTab === 'missions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. DAILY STREAK CALENDAR GRID */}
            {streakData && (
              <div style={{
                padding: '24px', borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 191, 36, 0.1), rgba(15, 23, 42, 0.95))',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                boxShadow: '0 10px 30px rgba(249, 115, 22, 0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem', boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)',
                    }}>
                      🔥
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
                        Calendario de Racha Diaria
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                        Racha actual: <strong style={{ color: '#f97316' }}>{streakData.currentStreak} días</strong> consecutivo(s)
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: streakData.hasCheckedInToday ? '#22c55e' : '#fbbf24', fontWeight: 800 }}>
                    {streakData.hasCheckedInToday ? '✅ Check-in de hoy registrado' : '⚡ Haz tu check-in hoy'}
                  </div>
                </div>

                {/* 7-Day Grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '10px',
                }}>
                  {streakData.days.map((d) => (
                    <div
                      key={d.day}
                      style={{
                        padding: '14px 10px', borderRadius: '16px',
                        background: d.isCompleted
                          ? 'rgba(34, 197, 94, 0.15)'
                          : d.isCurrent
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(251, 191, 36, 0.2))'
                          : 'rgba(0,0,0,0.3)',
                        border: d.isCompleted
                          ? '1px solid rgba(34, 197, 94, 0.4)'
                          : d.isCurrent
                          ? '1px solid #f97316'
                          : '1px solid rgba(255,255,255,0.06)',
                        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: d.isCurrent ? '#f97316' : '#a1a1aa' }}>
                        DÍAS {d.day}
                      </span>
                      <span style={{ fontSize: '1.4rem' }}>
                        {d.isChest ? '🎁' : '⭐'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: d.isCompleted ? '#22c55e' : '#fff' }}>
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. COMMUNITY WEEKLY CHALLENGE WIDGET */}
            {communityChallenge && (
              <div style={{
                padding: '20px 24px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '16px',
              }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase' }}>
                      🌐 Desafío Cooperativo Semanal
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>
                    {communityChallenge.title}
                  </h4>
                  <p style={{ margin: '4px 0 10px', fontSize: '0.82rem', color: '#a1a1aa' }}>
                    {communityChallenge.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, marginBottom: '4px' }}>
                    <span>Progreso del Gremio</span>
                    <span>{communityChallenge.currentProgress} / {communityChallenge.goal} aportes ({communityChallenge.progressPct}%)</span>
                  </div>

                  <div style={{
                    width: '100%', height: '8px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      width: `${communityChallenge.progressPct}%`,
                      background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
                    }} />
                  </div>
                </div>

                <div style={{
                  padding: '12px 18px', borderRadius: '16px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 700 }}>RECOMPENSA COLECTIVA</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fbbf24', marginTop: '2px' }}>
                    +{communityChallenge.rewardStardust} ⭐ Stardust
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                    +{communityChallenge.rewardXp} XP
                  </div>
                </div>
              </div>
            )}

            {/* 3. MISSIONS LIST GRID */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#a1a1aa' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</div>
                <div>Cargando Misiones...</div>
              </div>
            ) : missions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {[...missions].sort((a, b) => {
                  const aClaimed = !!a.claimedAt;
                  const bClaimed = !!b.claimedAt;
                  const aDone = a.completed || (a.currentProgress >= a.goal);
                  const bDone = b.completed || (b.currentProgress >= b.goal);
                  const getPriority = (claimed: boolean, done: boolean) => {
                    if (done && !claimed) return 0;
                    if (!done && !claimed) return 1;
                    return 2;
                  };
                  return getPriority(aClaimed, aDone) - getPriority(bClaimed, bDone);
                }).map(m => {
                  const actionInfo = getMissionActionInfo(m.action);
                  const isDone = m.completed;
                  const isClaimed = !!m.claimedAt;
                  const progressPct = Math.min(100, Math.round((m.currentProgress / m.goal) * 100));

                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '20px', borderRadius: '20px',
                        background: isClaimed
                          ? 'rgba(34, 197, 94, 0.04)'
                          : isDone
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(255,255,255,0.02))'
                          : 'rgba(0,0,0,0.3)',
                        border: isClaimed
                          ? '1px solid rgba(34, 197, 94, 0.3)'
                          : isDone
                          ? '1px solid rgba(168, 85, 247, 0.5)'
                          : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: isDone && !isClaimed ? '0 0 25px rgba(168, 85, 247, 0.2)' : 'none',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        gap: '14px', transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isDone ? '#fff' : '#e4e4e7' }}>
                            {m.title}
                          </span>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800,
                            padding: '3px 8px', borderRadius: '8px',
                            background: isClaimed ? 'rgba(34, 197, 94, 0.2)' : isDone ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: isClaimed ? '#22c55e' : isDone ? '#c084fc' : '#a1a1aa',
                          }}>
                            {isClaimed ? '✅ Reclamada' : isDone ? '✨ Lista' : 'En Progreso'}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#a1a1aa', lineHeight: '1.4' }}>
                          {m.description}
                        </p>

                        <div style={{
                          padding: '8px 12px', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.3', marginBottom: '12px',
                        }}>
                          💡 <strong style={{ color: '#fbbf24' }}>¿Cómo hacerla?</strong> {actionInfo.instruction}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24',
                            padding: '3px 9px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px',
                          }}>
                            <StarIcon size={12} color="#fbbf24" /> +{m.stardustReward} Stardust
                          </span>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8',
                            padding: '3px 9px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                          }}>
                            ⚡ +{m.xpReward} XP
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '6px', fontWeight: 700 }}>
                          <span>Progreso</span>
                          <span>{m.currentProgress} / {m.goal}</span>
                        </div>

                        <div style={{
                          width: '100%', height: '7px', borderRadius: '4px',
                          background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '14px',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '4px',
                            width: `${progressPct}%`,
                            background: isClaimed ? '#22c55e' : 'linear-gradient(90deg, #a855f7, #ec4899)',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>

                        {isClaimed ? (
                          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#22c55e', fontWeight: 800 }}>
                            ✅ Recompensa entregada
                          </div>
                        ) : isDone ? (
                          <button
                            disabled={claimingMissionId === m.id}
                            onClick={() => handleClaimMission(m.id)}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
                              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                              color: '#fff', fontWeight: 900, fontSize: '0.82rem',
                              cursor: 'pointer', boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            }}
                          >
                            <SparkleSvg size={14} color="#fff" />
                            <span>¡Reclamar Recompensa!</span>
                          </button>
                        ) : actionInfo.href ? (
                          <button
                            onClick={() => router.push(actionInfo.href!)}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '12px',
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                              color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          >
                            <span>{actionInfo.label}</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#71717a' }}>
                            En curso hoy
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
                No hay misiones disponibles en este momento.
              </div>
            )}
          </div>
        )}

      </div>
    </ClientOnly>
  );
}
