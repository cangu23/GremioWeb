'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { X, Search, Sparkles, Send, Gift, Check, ArrowRight, UserCheck, AlertCircle, RefreshCw } from '@/components/ui/Icons';
import UserAvatar from '@/components/ui/UserAvatar';

export interface RecipientUser {
  id?: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

interface SendStardustModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient?: RecipientUser | null;
  onSuccess?: (newBalance: number) => void;
}

const PRESET_AMOUNTS = [
  { amount: 50, label: 'Caramelito', icon: '🍬', color: '#38bdf8' },
  { amount: 100, label: 'Café', icon: '☕', color: '#f59e0b' },
  { amount: 250, label: 'Pastel', icon: '🍰', color: '#ec4899' },
  { amount: 500, label: 'Varita Mágica', icon: '✨', color: '#a855f7' },
  { amount: 1000, label: 'Gemas', icon: '💎', color: '#3b82f6' },
  { amount: 2500, label: 'Cohete', icon: '🚀', color: '#ef4444' },
  { amount: 5000, label: 'Corona', icon: '👑', color: '#eab308' },
  { amount: 10000, label: 'Galaxia', icon: '🌟', color: '#10b981' },
];

const PRESET_MESSAGES = [
  '¡Excelente contenido! 👏',
  '¡Un regalito estelar para ti! 🎁',
  '¡Sigue así, crack! 🚀',
  '¡Para un café! ☕',
  '¡Te mereces el universo! 🌟',
  '¡Mucho éxito con tus transmisiones! 🔥',
];

export default function SendStardustModal({
  isOpen,
  onClose,
  recipient: initialRecipient,
  onSuccess,
}: SendStardustModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedRecipient, setSelectedRecipient] = useState<RecipientUser | null>(initialRecipient || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecipientUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [successResult, setSuccessResult] = useState<{ amount: number; recipient: string; newBalance: number } | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial recipient if provided or changed
  useEffect(() => {
    if (initialRecipient) {
      setSelectedRecipient(initialRecipient);
      setSearchQuery(initialRecipient.username);
    }
  }, [initialRecipient]);

  // Fetch current user Stardust balance when modal opens
  const fetchBalance = useCallback(async () => {
    if (!user) return;
    setLoadingBalance(true);
    try {
      const res = await apiFetch('/ecosystem/stardust');
      if (res?.data?.stardust !== undefined) {
        setUserBalance(res.data.stardust);
      } else if (res?.stardust !== undefined) {
        setUserBalance(res.stardust);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
      setSuccessResult(null);
    }
  }, [isOpen, fetchBalance]);

  // Handle user live search and suggestions
  const fetchUsers = async (query: string) => {
    setSearching(true);
    try {
      const cleanVal = query.replace(/^@/, '').trim();
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(cleanVal)}`);
      const usersList: RecipientUser[] = Array.isArray(data) ? data : data?.data || [];
      setSearchResults(usersList.filter((u) => u.username.toLowerCase() !== user?.username?.toLowerCase()));
      setShowDropdown(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchFocus = () => {
    fetchUsers(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(val);
    }, 200);
  };

  const selectUser = (u: RecipientUser) => {
    setSelectedRecipient(u);
    setSearchQuery(u.username);
    setShowDropdown(false);
  };

  const clearRecipient = () => {
    setSelectedRecipient(null);
    setSearchQuery('');
  };

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;
  const currentStardust = userBalance !== null ? userBalance : ((user as any)?.stardust ?? 0);
  const isInsufficient = currentStardust < effectiveAmount;

  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const target = selectedRecipient?.username || searchQuery.replace(/^@/, '').trim();
    if (!target) {
      showToast('Por favor selecciona o ingresa el usuario destinatario', 'error');
      return;
    }

    if (effectiveAmount <= 0) {
      showToast('Ingresa una cantidad válida de Stardust', 'error');
      return;
    }

    if (isInsufficient) {
      showToast(`No tienes suficiente Polvo Estelar (tienes ⭐ ${currentStardust.toLocaleString()})`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/ecosystem/stardust/transfer', {
        method: 'POST',
        body: JSON.stringify({
          targetUser: target,
          amount: effectiveAmount,
          message: message.trim() || undefined,
        }),
      });

      const newBal = res.newBalance ?? (currentStardust - effectiveAmount);
      setUserBalance(newBal);
      playSuccessSound();

      setSuccessResult({
        amount: effectiveAmount,
        recipient: selectedRecipient?.displayName || `@${target}`,
        newBalance: newBal,
      });

      if (onSuccess) onSuccess(newBal);
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar Stardust', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(22, 20, 38, 0.98) 0%, rgba(13, 11, 24, 0.99) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.2)',
          color: '#fff',
          padding: '20px 22px',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px', flexShrink: 0 }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 8px auto',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.45))',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Sparkles size={22} color="#fbbf24" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
            Regalar Polvo Estelar
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px', margin: 0 }}>
            Envía puntos y apoya a tus creadores o amigos favoritos
          </p>
        </div>

        {/* SUCCESS CELEBRATION VIEW */}
        {successResult ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '20px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              animation: 'scaleUp 0.3s ease-out',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉✨</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', margin: '0 0 8px 0' }}>
              ¡Regalo Enviado con Éxito!
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#e5e7eb', marginBottom: '16px' }}>
              Le has entregado <strong style={{ color: '#fbbf24' }}>⭐ {successResult.amount.toLocaleString()} Polvo Estelar</strong> a{' '}
              <strong style={{ color: '#fff' }}>{successResult.recipient}</strong>.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                fontSize: '0.85rem',
                color: '#9ca3af',
                marginBottom: '24px',
              }}
            >
              <span>Tu nuevo saldo:</span>
              <strong style={{ color: '#fbbf24', fontWeight: 700 }}>⭐ {successResult.newBalance.toLocaleString()}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setSuccessResult(null);
                  setMessage('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Regalar a alguien más
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* RECIPIENT SELECTOR */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px', letterSpacing: '0.05em' }}>
                Destinatario
              </label>

              {selectedRecipient ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserAvatar
                      src={selectedRecipient.avatarUrl}
                      alt={selectedRecipient.username}
                      size={36}
                      user={selectedRecipient}
                      userId={selectedRecipient.id}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                        {selectedRecipient.displayName || selectedRecipient.username}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>@{selectedRecipient.username}</div>
                    </div>
                  </div>

                  {!initialRecipient && (
                    <button
                      type="button"
                      onClick={clearRecipient}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#a1a1aa',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                    <input
                      type="text"
                      placeholder="Buscar por @usuario o nombre de perfil..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={handleSearchFocus}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                    {searching && <RefreshCw size={16} className="spin" style={{ position: 'absolute', right: '12px', color: '#fbbf24' }} />}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        borderRadius: '16px',
                        background: '#18162c',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(245, 158, 11, 0.15)',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '8px 12px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        👥 Sugerencias de Usuarios
                      </div>
                      {searchResults.map((u) => {
                        const isVtuber = u.role === 'VTUBER';
                        const isMaid = u.role === 'MAID';
                        const isAdmin = u.role === 'ADMIN';
                        const displayName = u.displayName || u.username;

                        return (
                          <div
                            key={u.id || u.username}
                            onClick={() => selectUser(u)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <UserAvatar
                                 src={u.avatarUrl}
                                 alt={u.username}
                                 size={32}
                                 user={u}
                                 userId={u.id}
                               />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{displayName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>@{u.username}</div>
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: isVtuber
                                  ? 'rgba(168,85,247,0.2)'
                                  : isMaid
                                  ? 'rgba(212,160,48,0.2)'
                                  : isAdmin
                                  ? 'rgba(239,68,68,0.2)'
                                  : 'rgba(255,255,255,0.06)',
                                color: isVtuber ? '#c084fc' : isMaid ? '#d4a030' : isAdmin ? '#f87171' : '#9ca3af',
                                border: isVtuber
                                  ? '1px solid rgba(168,85,247,0.4)'
                                  : isMaid
                                  ? '1px solid rgba(212,160,48,0.4)'
                                  : isAdmin
                                  ? '1px solid rgba(239,68,68,0.4)'
                                  : '1px solid rgba(255,255,255,0.1)',
                              }}
                            >
                              {isVtuber ? '👑 VTuber' : isMaid ? '🧹 Maid' : isAdmin ? '🛡️ Admin' : '👤 Usuario'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PRESET AMOUNTS SELECTOR */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>
                  Cantidad a Regalar
                </label>
                <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                  Tu saldo: ⭐ {currentStardust.toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                {PRESET_AMOUNTS.map((item) => {
                  const isSelected = !isCustom && selectedAmount === item.amount;
                  return (
                    <button
                      key={item.amount}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedAmount(item.amount);
                      }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? `${item.color}22` : 'rgba(255, 255, 255, 0.03)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? `0 0 10px ${item.color}33` : 'none',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.78rem', color: isSelected ? item.color : '#fff' }}>
                        ⭐ {item.amount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: '#9ca3af', lineHeight: 1 }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM AMOUNT TOGGLE */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: isCustom ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isCustom ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isCustom ? '#fbbf24' : '#9ca3af',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Monto Personalizado
                </button>

                {isCustom && (
                  <input
                    type="number"
                    placeholder="Monto exacto..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="1"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            </div>

            {/* PRESET MESSAGES */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px', letterSpacing: '0.05em' }}>
                Mensaje Especial (Opcional)
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {PRESET_MESSAGES.map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => setMessage(msg)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: message === msg ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: message === msg ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: message === msg ? '#fbbf24' : '#d1d5db',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {msg}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Escribe algo bonito para acompañar tu regalo..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={140}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>

            {/* INSUFFICIENT BALANCE WARNING */}
            {isInsufficient && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                }}
              >
                <AlertCircle size={18} />
                <div>
                  No tienes suficiente Polvo Estelar. Te faltan{' '}
                  <strong>⭐ {(effectiveAmount - currentStardust).toLocaleString()}</strong>.
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting || isInsufficient || effectiveAmount <= 0}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background:
                  submitting || isInsufficient || effectiveAmount <= 0
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: submitting || isInsufficient || effectiveAmount <= 0 ? '#6b7280' : '#000',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: submitting || isInsufficient || effectiveAmount <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow:
                  submitting || isInsufficient || effectiveAmount <= 0
                    ? 'none'
                    : '0 8px 24px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="spin" /> Enviando regalo...
                </>
              ) : (
                <>
                  <Gift size={18} /> Enviar ⭐ {effectiveAmount.toLocaleString()} Stardust
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
