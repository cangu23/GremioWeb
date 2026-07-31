'use client';

import { useState, useEffect } from 'react';
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
  petData: PetData;
  onPetUpdated?: (updatedPet: any) => void;
  compact?: boolean;
}

export default function PetWidget({ petOwnerId, petData, onPetUpdated, compact = false }: PetWidgetProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [pet, setPet] = useState<PetData>(petData);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [levelUpEffect, setLevelUpEffect] = useState(false);

  useEffect(() => {
    setPet(petData);
  }, [petData]);

  if (!pet.profilePet) return null;

  const petName = pet.petName || 'Mascota';
  const level = pet.petLevel || 1;
  const exp = pet.petExp || 0;
  const hunger = pet.petHunger ?? 80;
  const expInLevel = exp % 100;

  // Active image: action GIF #2 when hovered or feeding, idle image #1 otherwise
  const activeImage = (isHovered || isFeeding) && pet.petImage2 ? pet.petImage2 : pet.profilePet;

  const handleFeed = async () => {
    if (!user) {
      showToast('Inicia sesión para alimentar a la mascota', 'error');
      return;
    }
    try {
      setIsFeeding(true);
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 1800);

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
        setTimeout(() => setLevelUpEffect(false), 3000);
        showToast(`🎉 ¡${petName} ha subido al Nivel ${res.pet?.petLevel || level + 1}! ✨`, 'success');
      } else {
        showToast(res.message || `🍖 ¡${petName} disfrutó su comida! (+20 XP)`, 'success');
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
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isFeeding ? '🍖 Alimentando...' : '🍖 Alimentar (1 Racha / 50⭐)'}
      </button>
    </div>
  );
}
