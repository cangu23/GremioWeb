'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ChestData {
  type: 'BRONZE' | 'SILVER' | 'GOLD' | 'COSMIC';
  label: string;
  finalXp: number;
  finalStardust: number;
  itemsWon?: string[];
}

interface ChestOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  chestData: ChestData | null;
}

const CHEST_CONFIGS: Record<string, {
  name: string;
  color: string;
  glow: string;
  bgGradient: string;
  badge: string;
  icon: string;
  accentBorder: string;
}> = {
  BRONZE: {
    name: 'Cofre de Bronce',
    color: '#cd7f32',
    glow: 'rgba(205, 127, 50, 0.6)',
    bgGradient: 'linear-gradient(135deg, #2a1b0e 0%, #4a2e16 100%)',
    badge: '🥉 Bronce Místico',
    icon: '🥉',
    accentBorder: '#e69a4c',
  },
  SILVER: {
    name: 'Cofre de Plata',
    color: '#e2e8f0',
    glow: 'rgba(226, 232, 240, 0.7)',
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    badge: '🥈 Plata Resplandeciente',
    icon: '🥈',
    accentBorder: '#94a3b8',
  },
  GOLD: {
    name: 'Cofre de Oro',
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.8)',
    bgGradient: 'linear-gradient(135deg, #3b2d00 0%, #664d00 100%)',
    badge: '🥇 Oro Legendario',
    icon: '🥇',
    accentBorder: '#ffe033',
  },
  COSMIC: {
    name: 'Cofre Estelar Cósmico',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.9)',
    bgGradient: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #1e1b4b 100%)',
    badge: '🌌 JACKPOT CÓSMICO',
    icon: '🌌',
    accentBorder: '#f0abfc',
  },
};

export default function ChestOpeningModal({ isOpen, onClose, chestData }: ChestOpeningModalProps) {
  const [stage, setStage] = useState<'IDLE' | 'OPENING' | 'REVEALED'>('IDLE');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStage('IDLE');
    }
  }, [isOpen]);

  if (!isOpen || !chestData || !mounted) return null;

  const config = CHEST_CONFIGS[chestData.type] || CHEST_CONFIGS.BRONZE;

  const playChestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freqs = [330, 440, 554.37, 659.25, 880, 1108.73, 1318.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.5);
      });
    } catch {}
  };

  const handleOpen = () => {
    if (stage !== 'IDLE') return;
    setStage('OPENING');
    playChestSound();

    setTimeout(() => {
      setStage('REVEALED');
    }, 900);
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 5, 10, 0.88)',
      backdropFilter: 'blur(16px)',
      animation: 'fadeIn 0.3s ease',
      padding: '20px',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes chestShake {
          0% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-6deg) scale(1.05); }
          40% { transform: rotate(6deg) scale(1.1); }
          60% { transform: rotate(-8deg) scale(1.15); }
          80% { transform: rotate(8deg) scale(1.2); }
          100% { transform: rotate(0deg) scale(1.25); }
        }
        @keyframes rewardPop {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; }
          70% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes cosmicPulse {
          0%, 100% { box-shadow: 0 0 30px ${config.glow}; }
          50% { box-shadow: 0 0 70px ${config.glow}; }
        }
        @keyframes lightRay {
          0% { transform: rotate(0deg) scale(1); opacity: 0.3; }
          50% { transform: rotate(180deg) scale(1.3); opacity: 0.8; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.3; }
        }
      `}</style>

      {/* Light Rays Effect in Background */}
      {stage !== 'IDLE' && (
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: 'lightRay 6s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        borderRadius: '24px',
        background: config.bgGradient,
        border: `2px solid ${config.accentBorder}`,
        boxShadow: `0 0 50px ${config.glow}`,
        padding: '32px 24px',
        textAlign: 'center',
        color: '#fff',
        overflow: 'hidden',
        animation: 'cosmicPulse 3s infinite ease-in-out',
      }}>
        {/* Top Header Badge */}
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: `1px solid ${config.accentBorder}`,
          fontSize: '0.82rem',
          fontWeight: 800,
          color: config.color,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '20px',
        }}>
          {config.badge}
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '6px', color: '#fff' }}>
          {config.name}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.75)', marginBottom: '24px' }}>
          {stage === 'IDLE' ? '¡Toca el cofre para desbloquear tus tesoros estelares!' : '¡Descubriendo recompensas épicas!'}
        </p>

        {/* ── Chest Graphic Representation ── */}
        <div 
          onClick={handleOpen}
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            margin: '0 auto 28px',
            cursor: stage === 'IDLE' ? 'pointer' : 'default',
            animation: stage === 'OPENING' ? 'chestShake 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97)' : 'none',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => { if (stage === 'IDLE') e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { if (stage === 'IDLE') e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {/* Main 3D Chest Container */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            background: `radial-gradient(circle at 50% 30%, ${config.color} 0%, rgba(0,0,0,0.8) 100%)`,
            border: `3px solid ${config.accentBorder}`,
            boxShadow: `0 10px 30px ${config.glow}, inset 0 0 20px rgba(0,0,0,0.6)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Chest Lock Ornament */}
            <div style={{
              fontSize: '4.5rem',
              filter: `drop-shadow(0 0 15px ${config.color})`,
              userSelect: 'none',
            }}>
              {config.icon}
            </div>

            {/* Tap prompt badge */}
            {stage === 'IDLE' && (
              <div style={{
                position: 'absolute',
                bottom: '-12px',
                padding: '4px 14px',
                borderRadius: '12px',
                background: config.color,
                color: '#000',
                fontWeight: 900,
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
              }}>
                ✨ ¡TOCA PARA ABRIR!
              </div>
            )}
          </div>
        </div>

        {/* ── Revealed Rewards Section ── */}
        {stage === 'REVEALED' && (
          <div style={{ animation: 'rewardPop 0.5s ease forwards', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: config.color }}>
              ¡Tus Recompensas del Cofre! 🎁
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '0 auto' }}>
              {/* XP Reward Card */}
              {chestData.finalXp > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'rgba(139, 92, 246, 0.25)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                }}>
                  <span>⚡ Experiencia (XP)</span>
                  <span style={{ color: '#A78BFA' }}>+{chestData.finalXp} XP</span>
                </div>
              )}

              {/* Stardust Reward Card */}
              {chestData.finalStardust > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                }}>
                  <span>⭐ Polvo Estelar</span>
                  <span style={{ color: '#F59E0B' }}>+⭐ {chestData.finalStardust}</span>
                </div>
              )}

              {/* Special Items Won */}
              {chestData.itemsWon && chestData.itemsWon.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                }}>
                  <span>🎉 Recompensa Especial</span>
                  <span style={{ color: '#34D399' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {stage === 'REVEALED' ? (
          <button
            onClick={onClose}
            className="btn btn--lg"
            style={{
              width: '100%',
              borderRadius: '14px',
              fontWeight: 800,
              background: `linear-gradient(135deg, ${config.color}, var(--primary))`,
              color: '#fff',
              boxShadow: `0 4px 20px ${config.glow}`,
            }}
          >
            ¡Reclamar Todo y Continuar! 🚀
          </button>
        ) : (
          <button
            onClick={handleOpen}
            disabled={stage === 'OPENING'}
            className="btn btn--lg"
            style={{
              width: '100%',
              borderRadius: '14px',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.15)',
              border: `1px solid ${config.accentBorder}`,
              color: '#fff',
            }}
          >
            {stage === 'OPENING' ? '¡Abriendo Cofre...' : '✨ Abrir Cofre'}
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
