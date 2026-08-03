import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Gift, X } from '@/components/ui/Icons';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface GiftPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
  recipientName?: string;
}

const PLAN_OPTIONS = [
  {
    key: 'ASTRO',
    name: 'Plan ASTRO',
    price: 2.99,
    badgeColor: '#38bdf8',
    gradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(56, 189, 248, 0.15))',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    stardustBonus: '+500 Stardust',
  },
  {
    key: 'NOVA',
    name: 'Plan NOVA',
    price: 5.99,
    badgeColor: '#c084fc',
    gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(192, 132, 252, 0.15))',
    border: '1px solid rgba(192, 132, 252, 0.5)',
    stardustBonus: '+1,500 Stardust',
    popular: true,
  },
  {
    key: 'STELLAR',
    name: 'Plan STELLAR',
    price: 12.99,
    badgeColor: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.3), rgba(251, 191, 36, 0.15))',
    border: '1px solid rgba(251, 191, 36, 0.6)',
    stardustBonus: '+5,000 Stardust',
  },
];

export default function GiftPlanModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
}: GiftPlanModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<string>('NOVA');
  const [customUsername, setCustomUsername] = useState<string>('');
  const [targetUser, setTargetUser] = useState<{ id: string; username: string; displayName?: string } | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (recipientId && recipientName) {
      setTargetUser({ id: recipientId, username: recipientName });
    }
  }, [recipientId, recipientName]);

  if (!isOpen) return null;

  const handleSearchUser = async () => {
    if (!customUsername.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await apiFetch(`/social/search?q=${encodeURIComponent(customUsername.trim())}`);
      const found = res?.users?.[0] || res?.[0];
      if (found) {
        setTargetUser({ id: found.id, username: found.username, displayName: found.displayName });
      } else {
        setSearchError('Usuario no encontrado. Verifica el nombre exacto.');
        setTargetUser(null);
      }
    } catch {
      setSearchError('No se pudo verificar el nombre de usuario.');
    } finally {
      setSearching(false);
    }
  };

  const handleGiftSubmit = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para regalar una membresía', 'info');
      router.push('/login');
      return;
    }

    const finalRecipientId = recipientId || targetUser?.id;
    if (!finalRecipientId) {
      showToast('Por favor especifica el usuario a quien le regalarás la membresía', 'error');
      return;
    }

    const plan = PLAN_OPTIONS.find(p => p.key === selectedPlan) || PLAN_OPTIONS[1];
    setLoading(true);

    try {
      showToast(`Abriendo pasarela de PayPal para regalar el ${plan.name}...`, 'info');

      const res = await apiFetch('/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: finalRecipientId,
          amount: plan.price,
          type: 'GIFT_PLAN',
          planKey: selectedPlan,
          message: message || undefined,
          anonymous,
        }),
      });

      if (res?.approveUrl) {
        window.location.href = res.approveUrl;
      } else {
        showToast('No se pudo generar la orden de regalo en PayPal', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al conectar con PayPal', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const activePlan = PLAN_OPTIONS.find(p => p.key === selectedPlan) || PLAN_OPTIONS[1];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: '24px',
          padding: '28px',
          background: 'linear-gradient(145deg, rgba(20,15,38,0.98), rgba(10,5,25,0.98))',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(147,51,234,0.2)',
          color: '#fff',
          position: 'relative',
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(192,132,252,0.15)',
              border: '1px solid rgba(192,132,252,0.3)',
              color: '#c084fc',
              fontSize: '0.82rem',
              fontWeight: 800,
              marginBottom: '12px',
            }}
          >
            <Gift size={16} /> REGALAR MEMBRESÍA PREMIUM
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '6px' }}>
            Regala una Experiencia Estelar
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Elige un plan y sorpréndelo con 30 días de beneficios exclusivos.
          </p>
        </div>

        {/* RECIPIENT SELECTOR */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#c084fc' }}>
            Beneficiario del Regalo:
          </label>

          {recipientName || targetUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9333ea, #c084fc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  color: '#fff',
                }}
              >
                {(recipientName || targetUser?.username)?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  @{recipientName || targetUser?.username}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Recibirá 30 días de suscripción Premium
                </div>
              </div>
              {!recipientId && (
                <button
                  onClick={() => setTargetUser(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nombre de usuario (ej. cangu_vt)"
                  value={customUsername}
                  onChange={e => setCustomUsername(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                <button
                  onClick={handleSearchUser}
                  disabled={searching}
                  className="btn btn--primary"
                  style={{ padding: '10px 16px', fontSize: '0.88rem', borderRadius: '12px' }}
                >
                  {searching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {searchError && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
                  {searchError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PLAN SELECTION */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: '#c084fc' }}>
            Selecciona el Nivel de Plan:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {PLAN_OPTIONS.map((plan) => {
              const isSelected = selectedPlan === plan.key;
              return (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '16px',
                    background: isSelected ? plan.gradient : 'rgba(255,255,255,0.03)',
                    border: isSelected ? plan.border : '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 20px rgba(147, 51, 234, 0.25)' : 'none',
                  }}
                >
                  {plan.popular && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: '#9333ea',
                        color: '#fff',
                      }}
                    >
                      MÁS POPULAR
                    </span>
                  )}
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: plan.badgeColor, marginBottom: '4px' }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                    ${plan.price} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>USD</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#00e676', fontWeight: 700, marginTop: '4px' }}>
                    {plan.stardustBonus}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MESSAGE & ANONYMOUS */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
            Mensaje de Regalo (Opcional):
          </label>
          <textarea
            rows={2}
            placeholder="¡Espero que disfrutes de tu membresía Premium!"
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '0.85rem',
              resize: 'none',
              marginBottom: '12px',
            }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#9333ea' }}
            />
            <span>Regalar de forma anónima (ocultar mi nombre)</span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          onClick={handleGiftSubmit}
          disabled={loading || (!recipientId && !targetUser)}
          className="btn"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 800,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #9333ea, #c084fc)',
            border: 'none',
            color: '#fff',
            boxShadow: '0 0 25px rgba(147, 51, 234, 0.4)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Gift size={20} />
          {loading
            ? 'Abriendo PayPal...'
            : `Regalar ${activePlan.name} por $${activePlan.price} USD`}
        </button>
      </div>
    </div>,
    document.body
  );
}
