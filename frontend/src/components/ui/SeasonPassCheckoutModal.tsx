'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@/components/ui/Icons';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import CreatorCodeInput from '@/components/ui/CreatorCodeInput';

interface SeasonPassCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessStardust?: () => void;
  initialCreatorCode?: string;
}

export default function SeasonPassCheckoutModal({
  isOpen,
  onClose,
  onSuccessStardust,
  initialCreatorCode = '',
}: SeasonPassCheckoutModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedTier, setSelectedTier] = useState<'PASS' | 'BOOST' | 'STARDUST'>('PASS');
  const [creatorCode, setCreatorCode] = useState(initialCreatorCode);
  const [validCreatorInfo, setValidCreatorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialCreatorCode && !creatorCode) {
      setCreatorCode(initialCreatorCode);
    }
  }, [initialCreatorCode, creatorCode]);

  if (!isOpen || !mounted) return null;

  const handleBuyWithPayPal = async (tier: 'PASS' | 'BOOST') => {
    if (!user) {
      showToast('Debes iniciar sesión para comprar el Pase Estelar', 'info');
      return;
    }

    const isBoost = tier === 'BOOST';
    const amount = isBoost ? 7.99 : 3.99;
    const type = isBoost ? 'SEASON_PASS_BOOST' : 'SEASON_PASS';

    setLoading(true);
    try {
      showToast(`Conectando con PayPal para activar tu Pase Estelar ${isBoost ? '+ Impulso' : 'VIP'}...`, 'info');
      const res = await apiFetch<any>('/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          type,
          creatorCode: creatorCode?.trim() || undefined,
        }),
      });

      if (res?.approveUrl) {
        window.location.href = res.approveUrl;
      } else {
        showToast('No se pudo generar la pasarela de PayPal.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al conectar con PayPal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyWithStardust = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para canjear con Polvo Estelar', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<any>('/ecosystem/pass/buy-premium', { method: 'POST' });
      showToast(res?.message || '¡Pase Estelar VIP activado con éxito!', 'success');
      window.dispatchEvent(new Event('stardust-updated'));
      if (onSuccessStardust) onSuccessStardust();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'No se pudo canjear. Verifica que tengas al menos 2,500 ⭐ Polvo Estelar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #161622 0%, #0d0d14 100%)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(251, 191, 36, 0.15)',
          padding: '24px',
          color: '#fff',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              <span>⭐</span> Temporada Activa
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>
              Desbloquea el Pase Estelar VIP
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '6px 0 0' }}>
              Accede a cosméticos de temporada, multiplicadores de Stardust y recompensas exclusivas.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X />
          </button>
        </div>

        {/* Opciones de Compra */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Opción 1: Pase VIP $3.99 */}
          <div
            onClick={() => setSelectedTier('PASS')}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: selectedTier === 'PASS' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedTier === 'PASS' ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🌟</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>Pase Estelar VIP</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 700 }}>
                  Más Popular
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0 28px' }}>
                Desbloquea todas las recompensas de la fila VIP de la temporada actual.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fbbf24' }}>$3.99</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>USD única vez</div>
            </div>
          </div>

          {/* Opción 2: Pase VIP + Boost 10 Niveles $7.99 */}
          <div
            onClick={() => setSelectedTier('BOOST')}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: selectedTier === 'BOOST' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedTier === 'BOOST' ? '2px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚀</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>Pase VIP + Impulso 10 Niveles</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(192, 132, 252, 0.25)', color: '#d8b4fe', fontWeight: 700 }}>
                  +2,500 ⭐ Bonus
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0 28px' }}>
                Pase VIP + salta 10 niveles inmediatamente + 2,500 Polvo Estelar de regalo.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#c084fc' }}>$7.99</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>USD única vez</div>
            </div>
          </div>

          {/* Opción 3: Canjear con Polvo Estelar (Gratuito Jugando) */}
          <div
            onClick={() => setSelectedTier('STARDUST')}
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              background: selectedTier === 'STARDUST' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedTier === 'STARDUST' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>✨</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Canjear con Polvo Estelar</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 26px' }}>
                Desbloquea jugando misiones y participando en la comunidad.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>2,500 ⭐</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Stardust</div>
            </div>
          </div>
        </div>

        {/* Input de Código de Creador (si no es canje de Stardust) */}
        {selectedTier !== 'STARDUST' && (
          <div style={{ marginBottom: '20px' }}>
            <CreatorCodeInput
              value={creatorCode}
              onChange={setCreatorCode}
              onValidationChange={setValidCreatorInfo}
            />
          </div>
        )}

        {/* Reparto Transparente (35 / 35 / 30) */}
        {selectedTier !== 'STARDUST' && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              fontSize: '0.72rem',
              color: '#94a3b8',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}
          >
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
              🌱 Economía Sostenible y Transparente:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginTop: '6px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>35%</div>
                <div>Creadoras</div>
              </div>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>35%</div>
                <div>Servidores</div>
              </div>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>30%</div>
                <div>Desarrollo</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {selectedTier === 'STARDUST' ? (
          <button
            disabled={loading}
            onClick={handleBuyWithStardust}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? 'Canjeando...' : '⭐ Canjear Pase por 2,500 Polvo Estelar'}
          </button>
        ) : (
          <button
            disabled={loading}
            onClick={() => handleBuyWithPayPal(selectedTier as 'PASS' | 'BOOST')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: selectedTier === 'BOOST'
                ? 'linear-gradient(135deg, #c084fc, #9333ea)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: selectedTier === 'BOOST'
                ? '0 0 25px rgba(192, 132, 252, 0.4)'
                : '0 0 25px rgba(251, 191, 36, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>💳 Pagar con PayPal Segura</span>
            <span>({selectedTier === 'BOOST' ? '$7.99 USD' : '$3.99 USD'})</span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
