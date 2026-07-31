'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';

interface PetData {
  profilePet?: string | null;
  petName?: string | null;
  petImage2?: string | null;
  petLevel?: number | null;
  petExp?: number | null;
  petHunger?: number | null;
  lastFedAt?: string | null;
}

interface PetWidgetProps {
  petOwnerId: string;
  petOwnerUsername?: string;
  petData: PetData;
  onPetUpdated?: (updatedPet: any) => void;
  compact?: boolean;
  companion?: boolean;
  frameless?: boolean;
}

export default function PetWidget({
  petOwnerId,
  petOwnerUsername,
  petData,
  onPetUpdated,
  compact = false,
  companion = false,
  frameless = false,
}: PetWidgetProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [pet, setPet] = useState<PetData>(petData);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [levelUpEffect, setLevelUpEffect] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPet(petData);
  }, [petData]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  if (!pet.profilePet) return null;

  const petName = pet.petName || 'Mascota';
  const level = pet.petLevel || 1;
  const exp = pet.petExp || 0;
  const hunger = pet.petHunger ?? 80;
  const expInLevel = exp % 100;
  const isOwnPet = user?.id === petOwnerId;

  // Active image: action GIF #2 when hovered, feeding, or popover open, idle image #1 otherwise
  const activeImage = (isHovered || isFeeding || popoverOpen) && pet.petImage2 ? pet.petImage2 : pet.profilePet;

  const handleFeed = async () => {
    if (!user) {
      showToast('Inicia sesión para alimentar a la mascota', 'error');
      return;
    }
    try {
      setIsFeeding(true);
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 2000);

      const res = await apiFetch('/user/pet/feed', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: petOwnerId }),
      });

      if (res.pet) {
        setPet((prev) => ({
          ...prev,
          ...res.pet,
        }));
        if (onPetUpdated) onPetUpdated(res.pet);
      }

      if (res.leveledUp) {
        setLevelUpEffect(true);
        setTimeout(() => setLevelUpEffect(false), 3500);
        showToast(`🎉 ¡${petName} ha subido al Nivel ${res.pet?.petLevel || level + 1}! ✨`, 'success');
      } else {
        const feedMsg = isOwnPet
          ? `🍖 ¡Alimentaste a ${petName}! (+20 XP)`
          : `🍖 ¡Regalaste comida a ${petName}! (+20 XP)`;
        showToast(res.message || feedMsg, 'success');
      }

      window.dispatchEvent(new Event('stardust-updated'));
    } catch (err: any) {
      showToast(err?.message || 'Error al alimentar la mascota', 'error');
    } finally {
      setIsFeeding(false);
    }
  };

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '4px 10px', borderRadius: '12px',
        background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
      }}>
        <img
          src={activeImage}
          alt={petName}
          style={{ width: '26px', height: '26px', objectFit: 'contain' }}
        />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffd700' }}>
          {petName} (Niv. {level})
        </span>
      </div>
    );
  }

  // Frameless Mode (Clean crisp image without any card or frame, above Galería)
  if (frameless) {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '24px',
          width: '100%',
        }}
      >
        {/* Floating Hearts / Particle Animation */}
        {showHearts && (
          <div style={{
            position: 'absolute', top: '-20px', left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.6rem',
            animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
            pointerEvents: 'none',
            zIndex: 12,
          }}>
            🍖💖✨
          </div>
        )}

        {/* Level Up Banner Overlay */}
        {levelUpEffect && (
          <div style={{
            position: 'absolute', top: '-16px',
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            color: '#000', fontWeight: 900, fontSize: '0.75rem',
            padding: '3px 12px', borderRadius: '12px',
            boxShadow: '0 0 20px rgba(255,215,0,0.8)',
            animation: 'bounce 0.6s infinite alternate',
            zIndex: 15,
          }}>
            ⚡ LEVEL UP! ⚡
          </div>
        )}

        {/* Crisp Pet Character (NO FRAME, NO CARD, NO BORDER) */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          marginBottom: '8px',
        }}>
          <img
            src={activeImage}
            alt={petName}
            style={{
              maxHeight: '170px',
              maxWidth: '100%',
              objectFit: 'contain',
              imageRendering: 'auto',
              animation: isFeeding ? 'bounce 0.4s infinite' : 'pulse 3.5s infinite ease-in-out',
              transition: 'transform 0.25s ease',
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              cursor: 'pointer',
            }}
            onClick={handleFeed}
            title={`🐾 ${petName} — Haz clic para alimentar`}
          />
        </div>

        {/* Sleek Floating Controls Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '480px',
          padding: '8px 16px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
              🐾 {petName}
            </span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 800, color: '#ffd700',
              padding: '2px 8px', borderRadius: '8px',
              background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)',
            }}>
              Niv. {level}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '200px' }}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600 }}>
                <span>XP</span>
                <span>{expInLevel}/100</span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${expInLevel}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '3px' }} />
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600 }}>
                <span>🍔</span>
                <span>{hunger}%</span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${hunger}%`, height: '100%',
                  background: hunger > 50 ? '#10b981' : hunger > 20 ? '#f59e0b' : '#ef4444',
                  borderRadius: '3px',
                }} />
              </div>
            </div>
          </div>

          <button
            onClick={handleFeed}
            disabled={isFeeding}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: isFeeding ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 3px 10px rgba(245,158,11,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {isFeeding ? '🍖...' : isOwnPet ? '🍖 Alimentar (25⭐)' : `🍖 Regalar Comida (25⭐)`}
          </button>
        </div>
      </div>
    );
  }

  // Companion Mode (Stands beside avatar with interactive popover)
  if (companion) {
    return (
      <div
        ref={popoverRef}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Animated Companion Avatar Button */}
        <div
          onClick={() => setPopoverOpen(!popoverOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(28,25,50,0.92), rgba(15,14,30,0.95))',
            backdropFilter: 'blur(10px)',
            border: popoverOpen ? '1px solid #ffd700' : '1px solid rgba(255,215,0,0.4)',
            boxShadow: popoverOpen
              ? '0 0 20px rgba(255,215,0,0.5)'
              : '0 4px 14px rgba(0,0,0,0.4), 0 0 10px rgba(255,215,0,0.2)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isHovered || popoverOpen ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
          }}
          title={`🐾 ${petName} (Nivel ${level}) — Haz clic para alimentar`}
        >
          {/* Floating Hearts / Particle Animation */}
          {showHearts && (
            <div style={{
              position: 'absolute', top: '-24px', left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '1.2rem',
              animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
              pointerEvents: 'none',
              zIndex: 20,
            }}>
              🍖💖✨
            </div>
          )}

          <img
            src={activeImage}
            alt={petName}
            style={{
              width: '42px', height: '42px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
              animation: isFeeding ? 'bounce 0.4s infinite' : 'pulse 3s infinite ease-in-out',
            }}
          />

          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
              🐾 {petName}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffd700', whiteSpace: 'nowrap' }}>
              ⭐ Niv. {level}
            </div>
          </div>
        </div>

        {/* Popover Card */}
        {popoverOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '250px',
              padding: '16px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(28,25,50,0.98), rgba(15,14,30,0.98))',
              backdropFilter: 'blur(16px)',
              border: levelUpEffect ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.4)',
              boxShadow: levelUpEffect
                ? '0 0 30px rgba(255,215,0,0.6), 0 10px 30px rgba(0,0,0,0.7)'
                : '0 10px 30px rgba(0,0,0,0.7), 0 0 16px rgba(255,215,0,0.2)',
              zIndex: 100,
              animation: 'pcfBubbleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Pointer Triangle */}
            <div style={{
              position: 'absolute', top: '-6px', left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px', height: '10px',
              background: 'rgba(28,25,50,0.98)',
              borderLeft: '1px solid rgba(255,215,0,0.4)',
              borderTop: '1px solid rgba(255,215,0,0.4)',
            }} />

            {/* Level Up Banner Overlay */}
            {levelUpEffect && (
              <div style={{
                position: 'absolute', top: '-12px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                color: '#000', fontWeight: 900, fontSize: '0.7rem',
                padding: '2px 10px', borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(255,215,0,0.5)',
                animation: 'bounce 0.6s infinite alternate',
                zIndex: 10,
              }}>
                ⚡ LEVEL UP! ⚡
              </div>
            )}

            {/* Pet Header */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                🐾 {petName}
              </div>
              <div style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))',
                border: '1px solid rgba(255,215,0,0.4)',
                color: '#ffd700', fontSize: '0.7rem', fontWeight: 800,
              }}>
                ⭐ Nivel {level}
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div style={{ width: '100%', marginBottom: '8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600,
              }}>
                <span>Progreso XP</span>
                <span>{expInLevel} / 100 XP</span>
              </div>
              <div style={{
                width: '100%', height: '6px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${expInLevel}%`, height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  borderRadius: '4px', transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {/* Hunger Bar */}
            <div style={{ width: '100%', marginBottom: '12px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600,
              }}>
                <span>🍔 Hambre/Felicidad</span>
                <span>{hunger}%</span>
              </div>
              <div style={{
                width: '100%', height: '6px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${hunger}%`, height: '100%',
                  background: hunger > 50
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : hunger > 20
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
                  borderRadius: '4px', transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {/* Feed Button */}
            <button
              onClick={handleFeed}
              disabled={isFeeding}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: isFeeding ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {isFeeding ? '🍖 Alimentando...' : isOwnPet ? '🍖 Alimentar mi Mascota (25⭐)' : `🍖 Regalar Comida (25⭐)`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Standard Card Mode
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(30,27,55,0.9), rgba(18,16,36,0.95))',
        backdropFilter: 'blur(12px)',
        border: levelUpEffect ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
        borderRadius: '20px',
        padding: '16px',
        maxWidth: '260px',
        boxShadow: levelUpEffect
          ? '0 0 30px rgba(255,215,0,0.6)'
          : '0 8px 24px rgba(0,0,0,0.4), 0 0 14px rgba(255,215,0,0.15)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Level Up Banner Overlay */}
      {levelUpEffect && (
        <div style={{
          position: 'absolute', top: '-12px',
          background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
          color: '#000', fontWeight: 900, fontSize: '0.7rem',
          padding: '2px 10px', borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(255,215,0,0.5)',
          animation: 'bounce 0.6s infinite alternate',
          zIndex: 10,
        }}>
          ⚡ LEVEL UP! ⚡
        </div>
      )}

      {/* Floating Hearts / Particle Animation */}
      {showHearts && (
        <div style={{
          position: 'absolute', top: '10px', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '1.4rem',
          animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
          pointerEvents: 'none',
          zIndex: 12,
        }}>
          🍖💖✨
        </div>
      )}

      {/* Pet Image / GIF Container */}
      <div style={{
        position: 'relative',
        width: '110px', height: '110px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '10px',
      }}>
        <img
          src={activeImage}
          alt={petName}
          style={{
            maxWidth: '100px', maxHeight: '100px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
            animation: isFeeding ? 'bounce 0.4s infinite' : 'pulse 3s infinite ease-in-out',
            transition: 'all 0.2s',
          }}
        />
      </div>

      {/* Pet Name & Level Badge */}
      <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
        <div style={{
          fontSize: '0.92rem', fontWeight: 800, color: '#ffffff',
          letterSpacing: '0.02em', marginBottom: '2px',
        }}>
          🐾 {petName}
        </div>
        <div style={{
          display: 'inline-block',
          padding: '2px 8px', borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))',
          border: '1px solid rgba(255,215,0,0.4)',
          color: '#ffd700', fontSize: '0.72rem', fontWeight: 800,
        }}>
          ⭐ Nivel {level}
        </div>
      </div>

      {/* EXP Progress Bar */}
      <div style={{ width: '100%', marginBottom: '8px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600,
        }}>
          <span>Progreso XP</span>
          <span>{expInLevel} / 100 XP</span>
        </div>
        <div style={{
          width: '100%', height: '6px', borderRadius: '4px',
          background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${expInLevel}%`, height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '4px', transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Hunger Bar */}
      <div style={{ width: '100%', marginBottom: '14px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600,
        }}>
          <span>🍔 Hambre/Felicidad</span>
          <span>{hunger}%</span>
        </div>
        <div style={{
          width: '100%', height: '6px', borderRadius: '4px',
          background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${hunger}%`, height: '100%',
            background: hunger > 50
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : hunger > 20
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #ef4444, #f87171)',
            borderRadius: '4px', transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Feed Button */}
      <button
        onClick={handleFeed}
        disabled={isFeeding}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.78rem',
          cursor: isFeeding ? 'wait' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
      >
        {isFeeding ? '🍖 Alimentando...' : isOwnPet ? '🍖 Alimentar mi Mascota (25⭐)' : `🍖 Regalar Comida a @${petOwnerUsername || 'Usuario'} (25⭐)`}
      </button>
    </div>
  );
}
