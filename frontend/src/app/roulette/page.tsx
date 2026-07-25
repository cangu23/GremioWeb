'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';

interface Prize {
  id: string;
  label: string;
  value: number;
  weight: number;
  color: string;
}

interface RouletteStatus {
  canSpin: boolean;
  nextSpinAt: string | null;
  prizes: Prize[];
  currentStreak: number;
  bestStreak: number;
  streakBonusPercent: number;
  stardustCostForExtraSpin: number;
  userStardust: number;
}

interface SpinResult {
  prize: Prize;
  rotation: number;
  finalXp?: number;
  streakBonusPercent?: number;
  message: string;
}

interface SpinHistory {
  id: string;
  prize: string;
  prizeLabel: string;
  prizeValue: number;
  createdAt: string;
}

interface RouletteStats {
  totalSpins: number;
  totalXpEarned: number;
  highestXpWon: number;
  currentStreak: number;
  bestStreak: number;
}

// Meta info for prize cards & badges
const PRIZE_META: Record<string, { rarity: string; icon: string; badgeBg: string; pct: string }> = {
  xp_10: { rarity: 'Común', icon: '⚡', badgeBg: 'rgba(139, 92, 246, 0.2)', pct: '30%' },
  xp_25: { rarity: 'Común', icon: '⚡', badgeBg: 'rgba(124, 58, 237, 0.2)', pct: '25%' },
  xp_50: { rarity: 'Poco Común', icon: '✨', badgeBg: 'rgba(59, 130, 246, 0.2)', pct: '20%' },
  xp_100: { rarity: 'Raro', icon: '🔥', badgeBg: 'rgba(16, 185, 129, 0.2)', pct: '12%' },
  xp_200: { rarity: 'Épico', icon: '💎', badgeBg: 'rgba(236, 72, 153, 0.2)', pct: '7%' },
  xp_500: { rarity: 'Legendario', icon: '👑', badgeBg: 'rgba(245, 158, 11, 0.25)', pct: '3%' },
  badge_lucky: { rarity: 'Mítico', icon: '🍀', badgeBg: 'rgba(239, 68, 68, 0.25)', pct: '2%' },
  nothing: { rarity: 'Desafortunado', icon: '💨', badgeBg: 'rgba(107, 114, 128, 0.2)', pct: '1%' },
};

// Canvas confetti component for celebratory win modal
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
    const particles = Array.from({ length: 75 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 70,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    }));

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.d);
        p.tilt = Math.sin(p.tiltAngle) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > height) {
          p.x = Math.random() * width;
          p.y = -20;
        }
      });
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function RouletteContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [status, setStatus] = useState<RouletteStatus | null>(null);
  const [stats, setStats] = useState<RouletteStats | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [history, setHistory] = useState<SpinHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ledPhase, setLedPhase] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  const playWinSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const freqs = [261.63, 329.63, 392.0, 523.25, 659.25];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.3);
      });
    } catch {}
  }, [soundEnabled, getAudioContext]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch('/roulette/status', {});
      setStatus(data);
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch('/roulette/stats', {});
      setStats(data);
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiFetch('/roulette/history', {});
      setHistory(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchStatus();
      fetchStats();
      fetchHistory();
    }
  }, [user, isLoading, router, fetchStatus, fetchStats, fetchHistory]);

  // LED blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLedPhase((prev) => (prev + 1) % 2);
    }, spinning ? 120 : 800);
    return () => clearInterval(interval);
  }, [spinning]);

  // Countdown timer
  useEffect(() => {
    if (!status?.nextSpinAt) return;
    const interval = setInterval(() => {
      const diff = new Date(status.nextSpinAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('¡Disponible!');
        fetchStatus();
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [status?.nextSpinAt, fetchStatus]);

  const executeSpinAnimation = (res: SpinResult) => {
    setSpinResult(res);

    const prizes = status?.prizes || [];
    const prizeIndex = prizes.findIndex((p) => p.id === res.prize.id);
    const targetIndex = prizeIndex >= 0 ? prizeIndex : 0;
    const numSegments = prizes.length || 8;
    const segmentAngle = 360 / numSegments;

    // Formula: align target segment mid-angle to top center
    const targetSegmentAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const fullRotations = 360 * 6;
    const currentModulo = rotationAngle % 360;
    const deltaAngle = (targetSegmentAngle - currentModulo + 360) % 360;
    const finalAngle = rotationAngle + fullRotations + deltaAngle;

    let ticks = 0;
    const maxTicks = 22;
    const tickInterval = setInterval(() => {
      playTickSound();
      ticks++;
      if (ticks >= maxTicks) clearInterval(tickInterval);
    }, 180);

    setRotationAngle(finalAngle);

    setTimeout(() => {
      clearInterval(tickInterval);
      setSpinning(false);
      setModalOpen(true);
      playWinSound();
      fetchStatus();
      fetchStats();
      fetchHistory();
    }, 4500);
  };

  const handleFreeSpin = async () => {
    if (spinning || !status?.canSpin) return;
    setSpinning(true);
    setSpinResult(null);

    try {
      const res: SpinResult = await apiFetch('/roulette/spin', { method: 'POST' });
      executeSpinAnimation(res);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al girar', 'error');
      setSpinning(false);
    }
  };

  const handleStardustSpin = async () => {
    if (spinning) return;
    const cost = status?.stardustCostForExtraSpin || 50;
    if ((status?.userStardust || 0) < cost) {
      showToast(`No tienes suficiente Polvo Estelar (requieres 🪙 ${cost}).`, 'error');
      return;
    }

    setSpinning(true);
    setSpinResult(null);

    try {
      const res: SpinResult = await apiFetch('/roulette/spin-stardust', { method: 'POST' });
      executeSpinAnimation(res);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al girar con Polvo Estelar', 'error');
      setSpinning(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const prizes = status?.prizes || [];
  const numSegments = prizes.length || 8;
  const segmentAngle = 360 / numSegments;

  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 160;

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '50px', maxWidth: '950px' }}>
      {/* Top Banner: Streak & Stardust summary */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        padding: '14px 20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(245,158,11,0.15) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
      }}>
        {/* Left: Streak badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '1.6rem',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(245,158,11,0.2)',
            border: '1px solid rgba(245,158,11,0.4)',
          }}>
            🔥
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              Racha de Giro: {status?.currentStreak || 0} {status?.currentStreak === 1 ? 'Día' : 'Días'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Bono activo: <span style={{ color: '#F59E0B', fontWeight: 700 }}>+{status?.streakBonusPercent || 0}% XP</span> (Racha Récord: {status?.bestStreak || 0}d)
            </div>
          </div>
        </div>

        {/* Right: User Stardust chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '20px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#38BDF8',
          }}>
            <span>🪙</span> {status?.userStardust || 0} Polvo Estelar
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
            className="btn btn--ghost"
            style={{ padding: '8px 12px', borderRadius: '50%', fontSize: '1.1rem' }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Main Grid: Wheel + Sidebar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
        gap: '32px',
        alignItems: 'start',
      }}>
        {/* Left Column: Roulette Wheel */}
        <div className="glass" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 20px',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at center, rgba(139,92,246,0.08) 0%, rgba(15,23,42,0.6) 100%)',
        }}>
          {/* Pointer Arrow */}
          <div style={{
            position: 'relative',
            zIndex: 20,
            marginBottom: '-18px',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
            animation: spinning ? 'pointer-tick 0.15s ease-in-out infinite alternate' : 'none',
          }}>
            <svg width="36" height="42" viewBox="0 0 36 42" fill="none">
              <path d="M18 42L0 6C0 2.68629 8.05887 0 18 0C27.9411 0 36 2.68629 36 6L18 42Z" fill="url(#pointer-grad)" />
              <path d="M18 36L4 6C7.5 2 13 1 18 1C23 1 28.5 2 32 6L18 36Z" fill="#FBBF24" />
              <defs>
                <linearGradient id="pointer-grad" x1="18" y1="0" x2="18" y2="42" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* SVG Wheel Box */}
          <div style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            maxWidth: '100%',
          }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.85, 0.35, 1.0)' : 'none',
                transformOrigin: 'center center',
                filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.5))',
              }}
            >
              <defs>
                {prizes.map((p, i) => (
                  <radialGradient key={`grad-${i}`} id={`seg-grad-${i}`} cx="50%" cy="50%" r="50%">
                    <stop offset="30%" stopColor={p.color} />
                    <stop offset="100%" stopColor={adjustColorBrightness(p.color, -30)} />
                  </radialGradient>
                ))}
                <radialGradient id="hub-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="60%" stopColor="#1E1B4B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>
              </defs>

              <circle cx={cx} cy={cy} r={radius + 16} fill="#0F172A" stroke="rgba(139,92,246,0.4)" strokeWidth="4" />
              <circle cx={cx} cy={cy} r={radius + 8} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

              {/* 16 LED Bulbs on Rim */}
              {Array.from({ length: 16 }).map((_, idx) => {
                const angle = (idx * 360) / 16;
                const rad = (angle * Math.PI) / 180;
                const lx = cx + (radius + 12) * Math.cos(rad);
                const ly = cy + (radius + 12) * Math.sin(rad);
                const isActive = (idx + ledPhase) % 2 === 0;
                return (
                  <circle
                    key={`led-${idx}`}
                    cx={lx}
                    cy={ly}
                    r="4"
                    fill={isActive ? '#FBBF24' : '#4B5563'}
                    filter={isActive ? 'drop-shadow(0 0 6px #FBBF24)' : 'none'}
                  />
                );
              })}

              {/* Wheel Slices */}
              {prizes.map((prize, i) => {
                const startAngle = -90 + i * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const midAngle = startAngle + segmentAngle / 2;

                const radStart = (startAngle * Math.PI) / 180;
                const radEnd = (endAngle * Math.PI) / 180;
                const radMid = (midAngle * Math.PI) / 180;

                const x1 = cx + radius * Math.cos(radStart);
                const y1 = cy + radius * Math.sin(radStart);
                const x2 = cx + radius * Math.cos(radEnd);
                const y2 = cy + radius * Math.sin(radEnd);

                const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

                const textRadius = radius * 0.65;
                const tx = cx + textRadius * Math.cos(radMid);
                const ty = cy + textRadius * Math.sin(radMid);

                const meta = PRIZE_META[prize.id] || { icon: '🎁' };

                return (
                  <g key={prize.id}>
                    <path
                      d={pathData}
                      fill={`url(#seg-grad-${i})`}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1.5"
                    />

                    <g transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}>
                      <text
                        x={tx}
                        y={ty - 10}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="18"
                        style={{ userSelect: 'none' }}
                      >
                        {meta.icon}
                      </text>
                      <text
                        x={tx}
                        y={ty + 12}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="700"
                        style={{
                          userSelect: 'none',
                          fontFamily: 'system-ui, sans-serif',
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {prize.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              <circle cx={cx} cy={cy} r="34" fill="url(#hub-grad)" stroke="#FBBF24" strokeWidth="3" filter="drop-shadow(0 0 10px rgba(251,191,36,0.3))" />
              <circle cx={cx} cy={cy} r="22" fill="#0F172A" />

              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="18"
                style={{ userSelect: 'none' }}
              >
                ⭐
              </text>
            </svg>
          </div>

          {/* Spin Buttons Section */}
          <div style={{ marginTop: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Free Daily Spin Button */}
            {status?.canSpin ? (
              <button
                onClick={handleFreeSpin}
                disabled={spinning}
                className="btn btn--primary"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '14px 24px',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  boxShadow: '0 0 24px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                  opacity: spinning ? 0.65 : 1,
                  animation: !spinning ? 'roulette-pulse 2s ease-in-out infinite' : 'none',
                }}
              >
                {spinning ? 'Girando...' : '🎰 ¡GIRO GRATIS DIARIO!'}
              </button>
            ) : (
              /* Stardust Spin Button when Free Spin is on Cooldown */
              <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}>
                  ⏳ Próximo giro gratis en: <strong style={{ color: '#FFF' }}>{timeLeft}</strong>
                </div>

                <button
                  onClick={handleStardustSpin}
                  disabled={spinning || (status?.userStardust || 0) < (status?.stardustCostForExtraSpin || 50)}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                    color: '#FFF',
                    opacity: spinning || (status?.userStardust || 0) < (status?.stardustCostForExtraSpin || 50) ? 0.5 : 1,
                    cursor: spinning || (status?.userStardust || 0) < (status?.stardustCostForExtraSpin || 50) ? 'not-allowed' : 'pointer',
                  }}
                >
                  🪙 Giro Extra (50 Polvo Estelar)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prizes & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Lifetime Stats Card */}
          <div className="glass" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Mis Estadísticas en la Ruleta
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{stats?.totalSpins || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Giros Totales</div>
              </div>

              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>+{stats?.totalXpEarned || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>XP Ganado</div>
              </div>

              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F59E0B' }}>{stats?.highestXpWon || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Máximo XP</div>
              </div>
            </div>
          </div>

          {/* Prizes Breakdown Card */}
          <div className="glass" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏆</span> Premios y Probabilidades
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                8 Recompensas
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {prizes.map((p) => {
                const meta = PRIZE_META[p.id] || { rarity: 'Especial', icon: '🎁', badgeBg: 'rgba(255,255,255,0.1)', pct: '?' };
                const isLastWon = spinResult?.prize.id === p.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isLastWon ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: isLastWon ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                      }}>
                        {meta.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.label}</div>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: meta.badgeBg,
                          color: '#F3F4F6',
                        }}>
                          {meta.rarity}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {meta.pct}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Probabilidad</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History Drawer */}
          <div className="glass" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📜</span> Historial de Giros
              </h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn btn--ghost"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
              >
                {showHistory ? 'Ocultar' : `Ver (${history.length})`}
              </button>
            </div>

            {showHistory && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {history.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                    Aún no tienes giros registrados.
                  </p>
                ) : (
                  history.map((spin) => (
                    <div
                      key={spin.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)',
                        fontSize: '0.83rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{spin.prizeValue > 0 ? '🎉' : '💨'}</span>
                        <span style={{ fontWeight: 500 }}>{spin.prizeLabel}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(spin.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {modalOpen && spinResult && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div className="glass" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '420px',
            padding: '32px 24px',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(139,92,246,0.3)',
            animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            overflow: 'hidden',
          }}>
            {spinResult.prize.value > 0 && <ConfettiCanvas />}

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                fontSize: '3.5rem',
                marginBottom: '12px',
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
                animation: 'bounce 1s infinite alternate',
              }}>
                {PRIZE_META[spinResult.prize.id]?.icon || '🎁'}
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
                {spinResult.prize.id === 'nothing' ? '¡Vaya!' : '¡Felicidades! 🎉'}
              </h2>

              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                {spinResult.message}
              </p>

              {(spinResult.finalXp || spinResult.prize.value) > 0 && (
                <div style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '12px 28px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(245,158,11,0.3) 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>
                    ⚡ +{spinResult.finalXp || spinResult.prize.value} XP
                  </div>
                  {(spinResult.streakBonusPercent || 0) > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: 700 }}>
                      🔥 Incluye +{spinResult.streakBonusPercent}% por tu racha diaria
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setModalOpen(false)}
                className="btn btn--primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                }}
              >
                ¡Reclamar Recompensa!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS animations */}
      <style jsx global>{`
        @keyframes roulette-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 0 16px rgba(139,92,246,0); }
        }
        @keyframes pointer-tick {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(3px) rotate(-4deg); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00ff) + amt;
  let B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

export default function RoulettePage() {
  return (
    <ClientOnly>
      <RouletteContent />
    </ClientOnly>
  );
}
