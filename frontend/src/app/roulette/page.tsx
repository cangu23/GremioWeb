'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
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
}

interface SpinResult {
  prize: Prize;
  rotation: number;
  message: string;
}

interface SpinHistory {
  id: string;
  prize: string;
  prizeLabel: string;
  prizeValue: number;
  createdAt: string;
}

function RouletteContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [status, setStatus] = useState<RouletteStatus | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [history, setHistory] = useState<SpinHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchStatus();
      fetchHistory();
    }
  }, [user, isLoading, router]);

  const fetchStatus = async () => {
    try {
      const data = await apiFetch('/roulette/status', {});
      setStatus(data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const data = await apiFetch('/roulette/history', {});
      setHistory(data);
    } catch {}
  };

  const handleSpin = async () => {
    if (spinning || !status?.canSpin) return;
    setSpinning(true);
    setResult(null);

    try {
      const spinResult = await apiFetch('/roulette/spin', { method: 'POST' });
      setResult(spinResult);
      showToast(spinResult.message, spinResult.prize.id === 'nothing' ? 'error' : 'success');
      fetchStatus();
      fetchHistory();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al girar', 'error');
      setSpinning(false);
    }
  };

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
  }, [status?.nextSpinAt]);

  if (isLoading || !user) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const numSegments = status?.prizes.length || 7;
  const segmentAngle = 360 / numSegments;

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px', maxWidth: '700px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>🎰 Ruleta de la Suerte</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Gira la ruleta una vez al día para ganar XP y premios exclusivos
        </p>
      </div>

      {/* Roulette wheel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        {/* Pointer */}
        <div style={{
          width: '0', height: '0',
          borderLeft: '16px solid transparent',
          borderRight: '16px solid transparent',
          borderTop: '24px solid var(--primary)',
          position: 'relative', zIndex: 10,
          marginBottom: '-8px',
          filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.4))',
        }} />

        {/* Wheel container */}
        <div style={{
          position: 'relative',
          width: '320px', height: '320px',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '3px solid rgba(139,92,246,0.3)',
          boxShadow: '0 0 40px rgba(139,92,246,0.15), inset 0 0 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          {/* Spinning wheel */}
          <div ref={wheelRef}          style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            position: 'relative',
            transform: result ? `rotate(${result.rotation}deg)` : 'rotate(0deg)',
            transition: spinning
              ? 'none'
              : 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
          }}>
            {(status?.prizes || []).map((prize, i) => {
              const angle = i * segmentAngle;
              const midAngle = angle + segmentAngle / 2;
              const radians = (midAngle - 90) * (Math.PI / 180);

              return (
                <div key={prize.id} style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '50%', height: '2px',
                  transformOrigin: '0 0',
                  transform: `rotate(${angle}deg)`,
                  background: 'transparent',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '0', top: '-80px',
                    width: '160px', height: '160px',
                    background: prize.color,
                    opacity: 0.3,
                    clipPath: `polygon(0 0, 100% 50%, 0 100%)`,
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '20px', top: '-8px',
                    fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    transform: `rotate(${midAngle}deg)`,
                    transformOrigin: '0 50%',
                  }}>
                    {prize.label.length > 10 ? prize.label.slice(0, 10) + '…' : prize.label}
                  </div>
                </div>
              );
            })}

            {/* Center hub */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '56px', height: '56px',
              borderRadius: '50%',
              background: 'var(--bg-deep)',
              border: '3px solid rgba(139,92,246,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)',
              fontSize: '1.4rem',
              fontWeight: 700,
              zIndex: 5,
              boxShadow: '0 0 20px rgba(139,92,246,0.2)',
            }}>
              ⭐
            </div>
          </div>

          {/* Spinning overlay */}
          {spinning && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '50%',
              zIndex: 6,
            }}>
              <span style={{
                width: '24px', height: '24px',
                border: '3px solid rgba(255,255,255,0.2)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
            </div>
          )}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !status?.canSpin}
          className="btn"
          style={{
            marginTop: '24px', padding: '14px 48px', fontSize: '1.1rem', fontWeight: 700,
            opacity: spinning || !status?.canSpin ? 0.6 : 1,
            transition: 'all 0.3s ease',
            animation: status?.canSpin ? 'roulette-pulse 2s ease-in-out infinite' : 'none',
          }}
        >
          {spinning ? 'Girando...' : status?.canSpin ? '🎰 ¡Girar!' : `Espera ${timeLeft}`}
        </button>

        <style>{`
          @keyframes roulette-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
            50% { box-shadow: 0 0 0 12px rgba(139,92,246,0); }
          }
        `}</style>
      </div>

      {/* Result card */}
      {result && (
        <div className="glass" style={{
          padding: '24px', textAlign: 'center', marginBottom: '24px',
          borderColor: result.prize.id === 'nothing' ? 'rgba(107,114,128,0.2)' : 'rgba(139,92,246,0.2)',
          animation: 'fadeInUp 0.5s ease',
        }}>
          <div style={{
            fontSize: '2rem', marginBottom: '8px',
          }}>
            {result.prize.id === 'nothing' ? '😅' : result.prize.value > 0 ? '🎉' : '🏆'}
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>{result.message}</h3>
          {result.prize.value > 0 && (
            <p style={{ color: 'var(--primary)', fontWeight: 600 }}>
              +{result.prize.value} XP
            </p>
          )}
        </div>
      )}

      {/* History toggle */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="btn btn--ghost"
          style={{ fontSize: '0.85rem' }}
        >
          {showHistory ? 'Ocultar historial' : 'Ver historial de giros'}
        </button>
      </div>

      {showHistory && history.length > 0 && (
        <div className="glass" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Historial de giros</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.map((spin) => (
              <div key={spin.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: spin.prizeValue > 0 ? 'var(--primary)' : 'var(--text-muted)',
                  }} />
                  <span style={{ fontSize: '0.85rem' }}>{spin.prizeLabel}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(spin.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoulettePage() {
  return (
    <ClientOnly>
      <RouletteContent />
    </ClientOnly>
  );
}
