'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Gift, Heart, Star, Check } from '@/components/ui/Icons';

export interface GiftData {
  title?: string;
  senderName: string;
  senderAvatar?: string | null;
  amount?: string | number;
  message?: string;
  giftType?: 'STARDUST' | 'PREMIUM' | 'GENERIC';
  planName?: string;
}

interface GiftEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftData: GiftData | null;
}

export default function GiftEnvelopeModal({
  isOpen,
  onClose,
  giftData,
}: GiftEnvelopeModalProps) {
  const [isOpenState, setIsOpenState] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsOpenState(false);
      setIsOpening(false);
    }
  }, [isOpen]);

  if (!isOpen || !giftData) return null;

  const playOpenAudio = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.4);
      });
    } catch {}
  };

  const handleOpenEnvelope = () => {
    if (isOpenState || isOpening) return;
    setIsOpening(true);
    playOpenAudio();
    setTimeout(() => {
      setIsOpening(false);
      setIsOpenState(true);
    }, 600);
  };

  const isPremium = giftData.giftType === 'PREMIUM' || (giftData.title && giftData.title.toLowerCase().includes('membresía'));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && isOpenState) onClose();
      }}
    >
      {/* Outer Wrapper */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Close Button (visible when envelope is opened) */}
        {isOpenState && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '-48px',
              right: '0',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* ──────── UNOPENED ENVELOPE VIEW ──────── */}
        {!isOpenState && (
          <div
            onClick={handleOpenEnvelope}
            style={{
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              perspective: '1000px',
            }}
          >
            {/* Pulsing Hint Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '20px',
                background: isPremium
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,191,36,0.3))',
                border: isPremium ? '1px solid #c084fc' : '1px solid #fbbf24',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                marginBottom: '20px',
                boxShadow: isPremium ? '0 0 20px rgba(192,132,252,0.4)' : '0 0 20px rgba(245,158,11,0.4)',
                animation: 'pulse 1.8s infinite ease-in-out',
              }}
            >
              <Sparkles size={18} color={isPremium ? '#c084fc' : '#fbbf24'} />
              <span>✨ ¡Toca la carta para abrir tu regalo! ✨</span>
            </div>

            {/* 3D Interactive Envelope */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '270px',
                borderRadius: '24px',
                background: isPremium
                  ? 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #4c1d95 100%)'
                  : 'linear-gradient(135deg, #451a03 0%, #1c1917 50%, #78350f 100%)',
                border: isPremium ? '2px solid rgba(192,132,252,0.5)' : '2px solid rgba(251,191,36,0.5)',
                boxShadow: isPremium
                  ? '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168,85,247,0.3)'
                  : '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245,158,11,0.3)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
                transition: 'transform 0.3s ease, boxShadow 0.3s ease',
                transform: isOpening ? 'scale(0.96) rotateX(15deg)' : 'scale(1)',
              }}
            >
              {/* Envelope Flap Triangle (V shape overlay) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '140px',
                  background: isPremium
                    ? 'linear-gradient(180deg, rgba(168,85,247,0.25) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(245,158,11,0.25) 0%, transparent 100%)',
                  borderBottom: isPremium ? '1px solid rgba(192,132,252,0.3)' : '1px solid rgba(251,191,36,0.3)',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  transformOrigin: 'top center',
                  transition: 'transform 0.5s ease',
                  transform: isOpening ? 'rotateX(180deg)' : 'rotateX(0deg)',
                  zIndex: 2,
                }}
              />

              {/* Gold / Purple Ribbon Lines */}
              <div
                style={{
                  position: 'absolute',
                  inset: '16px',
                  border: isPremium ? '1px stroke rgba(192,132,252,0.2)' : '1px stroke rgba(251,191,36,0.2)',
                  borderRadius: '16px',
                  pointerEvents: 'none',
                }}
              />

              {/* Sender Info Badge */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '8px 16px',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isPremium ? '#7c3aed' : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#fff',
                    overflow: 'hidden',
                    border: '2px solid #fff',
                  }}
                >
                  {giftData.senderAvatar ? (
                    <img src={giftData.senderAvatar} alt={giftData.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    giftData.senderName[0]?.toUpperCase()
                  )}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Regalo de</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>@{giftData.senderName}</div>
                </div>
              </div>

              {/* Wax Seal Icon */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isPremium
                    ? 'radial-gradient(circle, #a855f7 0%, #6b21a8 100%)'
                    : 'radial-gradient(circle, #fbbf24 0%, #b45309 100%)',
                  boxShadow: isPremium ? '0 0 25px rgba(168,85,247,0.6)' : '0 0 25px rgba(245,158,11,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #fff',
                  animation: 'float 3s ease-in-out infinite',
                }}
              >
                {isPremium ? <Gift size={32} color="#fff" /> : <Star size={32} color="#fff" fill="#fff" />}
              </div>

              <div style={{ marginTop: '14px', zIndex: 3 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  {giftData.title || '¡Carta de Regalo Especial!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────── OPENED LETTER VIEW ──────── */}
        {isOpenState && (
          <div
            style={{
              width: '100%',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(22, 20, 38, 0.98) 0%, rgba(13, 11, 24, 0.99) 100%)',
              border: isPremium ? '2px solid rgba(192, 132, 252, 0.6)' : '2px solid rgba(251, 191, 36, 0.6)',
              boxShadow: isPremium
                ? '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(168,85,247,0.3)'
                : '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(245,158,11,0.3)',
              padding: '32px 24px',
              textAlign: 'center',
              animation: 'scaleUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 16px auto',
                borderRadius: '50%',
                background: isPremium
                  ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPremium ? '0 0 30px rgba(168,85,247,0.5)' : '0 0 30px rgba(245,158,11,0.5)',
              }}
            >
              {isPremium ? <Gift size={36} color="#fff" /> : <Star size={36} color="#fff" fill="#fff" />}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>
              {isPremium ? '🎁 ¡Membresía Premium Regalada!' : '⭐ ¡Polvo Estelar Recibido!'}
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#9ca3af', margin: '0 0 20px 0' }}>
              Enviado con cariño por <strong style={{ color: '#fff' }}>@{giftData.senderName}</strong>
            </p>

            {/* Gift Main Highlight Box */}
            <div
              style={{
                padding: '20px',
                borderRadius: '18px',
                background: isPremium ? 'rgba(168,85,247,0.12)' : 'rgba(245,158,11,0.12)',
                border: isPremium ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(245,158,11,0.35)',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Premio Recibido
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isPremium ? '#c084fc' : '#fbbf24' }}>
                {giftData.amount
                  ? `⭐ ${Number(giftData.amount).toLocaleString()} Polvo Estelar`
                  : giftData.planName
                  ? `👑 Plan ${giftData.planName} (10 Días Premium)`
                  : giftData.title}
              </div>
            </div>

            {/* Personalized Message Card */}
            {giftData.message && (
              <div
                style={{
                  position: 'relative',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  color: '#e5e7eb',
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}
              >
                "{giftData.message}"
              </div>
            )}

            {/* Action Claim Button */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: isPremium
                  ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: isPremium ? '#fff' : '#000',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: isPremium ? '0 8px 25px rgba(168,85,247,0.4)' : '0 8px 25px rgba(245,158,11,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <Check size={20} /> ¡Aceptar y Disfrutar Regalo! 🎉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
