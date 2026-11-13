'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { apiFetch } from '@/lib/api';
import { useSocketMedia } from '@/lib/hooks/useSocketMedia';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { FourPointStar, Sparkles, Shield, Award, Check } from '@/components/ui/Icons';

/* Deterministic stars for background */
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: (i * 37 + 13) % 100,
  top: (i * 53 + 7) % 100,
  size: 1 + ((i * 11) % 3),
  delay: (i % 7) * 0.5,
}));

export default function InscripcionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { uploadAndWait } = useSocketMedia();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [step, setStep] = useState<'form' | 'card'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      setDisplayName(user.displayName || user.username || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');

      // Si el usuario ya tiene su nombre en el gremio configurado y entra directamente,
      // le mostramos su carnet directamente para que pueda descargarlo o admirarlo.
      if (user.displayName) {
        setStep('card');
      }
    }
  }, [user, isLoading, router]);

  // Selección y recorte de avatar
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    setCropperSrc(tempUrl);
    setCropperOpen(true);
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setUploadingAvatar(true);
    try {
      const croppedFile = new File([croppedBlob], `avatar_${Date.now()}.webp`, { type: 'image/webp' });
      const url = await uploadAndWait(croppedFile, '/uploads/avatar');
      setAvatarUrl(url);
      showToast('Retrato de aventurero actualizado con éxito', 'success');
    } catch (err: unknown) {
      showToast(`Error al subir retrato: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Guardado y sellado de la hoja de inscripción
  const handleSealInscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Por favor escribe tu Nombre o Alias en el Gremio', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim() || undefined,
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      window.dispatchEvent(new Event('user-refetched'));
      showToast('¡Inscripción sellada en los anales del Gremio!', 'success');
      setStep('card');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sellar inscripción';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3D Parallax Tilt en el carnet
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;
    setCardTilt({ x: tiltX, y: tiltY });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

  // Descarga del Carnet en alta resolución usando Canvas
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo cósmico
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f0c1f');
    bgGrad.addColorStop(0.5, '#191533');
    bgGrad.addColorStop(1, '#0b0914');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Borde exterior dorado
    ctx.strokeStyle = 'rgba(232, 199, 122, 0.7)';
    ctx.lineWidth = 10;
    ctx.strokeRect(25, 25, width - 50, height - 50);

    // Borde interior fino
    ctx.strokeStyle = 'rgba(232, 199, 122, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    // Encabezado
    ctx.fillStyle = '#E8C77A';
    ctx.font = 'bold 32px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ GREMIO ESTELAR ✦', width / 2, 110);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('CARNET OFICIAL DE AVENTURERO', width / 2, 145);

    // Retrato / Avatar
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 330, 140, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, width / 2 - 140, 190, 280, 280);
      ctx.restore();

      // Marco dorado del avatar
      ctx.beginPath();
      ctx.arc(width / 2, 330, 140, 0, Math.PI * 2);
      ctx.strokeStyle = '#E8C77A';
      ctx.lineWidth = 8;
      ctx.stroke();

      renderCardDetails();
    };

    avatarImg.onerror = () => {
      // Placeholder si no carga la imagen
      ctx.beginPath();
      ctx.arc(width / 2, 330, 140, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 90px sans-serif';
      ctx.fillText((displayName || username).charAt(0).toUpperCase(), width / 2, 365);
      renderCardDetails();
    };

    avatarImg.src = avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + username;

    const renderCardDetails = () => {
      // Nombre del aventurero
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(displayName || username, width / 2, 540);

      // Handle
      ctx.fillStyle = '#E8C77A';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`@${username}`, width / 2, 580);

      // Rango
      ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
      ctx.fillRect(width / 2 - 180, 620, 360, 48);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(width / 2 - 180, 620, 360, 48);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('★ INICIADO DE LAS ESTRELLAS', width / 2, 652);

      // Lema
      if (bio) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = 'italic 20px Georgia, serif';
        ctx.fillText(`"${bio.slice(0, 65)}${bio.length > 65 ? '...' : ''}"`, width / 2, 730);
      }

      // Ficha Técnica
      const cardId = `#GE-2026-${(user?.id || '0000').slice(-6).toUpperCase()}`;
      const joinDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 16px sans-serif';
      ctx.fillText('REGISTRO:', 140, 840);
      ctx.fillText('FECHA DE INGRESO:', 140, 885);
      ctx.fillText('ESTADO:', 140, 930);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(cardId, width - 140, 840);
      ctx.fillText(joinDate, width - 140, 885);
      ctx.fillStyle = '#34D399';
      ctx.fillText('ACTIVO Y RECONOCIDO', width - 140, 930);

      // Sello Dorado
      ctx.save();
      ctx.translate(width / 2, 1070);
      ctx.beginPath();
      ctx.arc(0, 0, 55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.fill();
      ctx.strokeStyle = '#E8C77A';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#E8C77A';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('✦ SELLO OFICIAL ✦', 0, -6);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('GREMIO ESTELAR', 0, 14);
      ctx.restore();

      // Disparar descarga
      const link = document.createElement('a');
      link.download = `Carnet-GremioEstelar-${username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('¡Carnet de Aventurero descargado!', 'success');
    };
  };

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0814' }}>
        <div style={{ textAlign: 'center', color: '#E8C77A' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid rgba(232, 199, 122, 0.2)',
            borderTopColor: '#E8C77A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <span>Accediendo a los registros del Gremio...</span>
        </div>
      </div>
    );
  }

  const memberId = `#GE-2026-${(user.id || '0000').slice(-6).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, #17132e 0%, #0c0a17 60%, #06050b 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'inherit',
    }}>
      {/* Fondo de estrellas */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map((s) => (
          <span
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: '50%',
              background: '#fff',
              opacity: 0.35,
              animation: `pulse ${2 + s.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div style={{ maxWidth: '640px', width: '100%', position: 'relative', zIndex: 10 }}>
        {step === 'form' ? (
          /* ========================================================================= */
          /* FASE 1: LA HOJA DE INSCRIPCIÓN AL GREMIO (PERGAMINO ARCANE)              */
          /* ========================================================================= */
          <div style={{
            background: 'linear-gradient(180deg, rgba(26, 22, 48, 0.96) 0%, rgba(15, 12, 28, 0.98) 100%)',
            border: '2px solid rgba(232, 199, 122, 0.45)',
            borderRadius: '24px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.15)',
            padding: '36px 32px',
            backdropFilter: 'blur(16px)',
            position: 'relative',
          }}>
            {/* Runas / Esquinas decorativas */}
            <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'rgba(232, 199, 122, 0.4)', fontSize: '0.8rem' }}>✦ ᚱ ✦</div>
            <div style={{ position: 'absolute', top: '12px', right: '16px', color: 'rgba(232, 199, 122, 0.4)', fontSize: '0.8rem' }}>✦ ᛋ ✦</div>
            <div style={{ position: 'absolute', bottom: '12px', left: '16px', color: 'rgba(232, 199, 122, 0.4)', fontSize: '0.8rem' }}>✦ ᛏ ✦</div>
            <div style={{ position: 'absolute', bottom: '12px', right: '16px', color: 'rgba(232, 199, 122, 0.4)', fontSize: '0.8rem' }}>✦ ᚹ ✦</div>

            {/* Cabecera del Pergamino */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                background: 'rgba(232, 199, 122, 0.12)',
                border: '1px solid rgba(232, 199, 122, 0.3)',
                color: '#E8C77A',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}>
                <Sparkles size={14} color="#E8C77A" />
                Registro Oficial de Aventureros
              </div>
              <h1 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '2rem',
                color: '#fff',
                margin: '0 0 10px',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}>
                Hoja de Inscripción al Gremio
              </h1>
              <p style={{
                fontSize: '0.88rem',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.5,
                margin: '0 auto',
                maxWidth: '480px',
              }}>
                Todo viajero que cruza el umbral de las estrellas debe firmar los anales del Gremio. Elige con sabiduría tu identidad ante las constelaciones.
              </p>
            </div>

            <form onSubmit={handleSealInscription}>
              {/* Sección Retrato de Aventurero */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '26px',
                padding: '18px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: avatarUrl
                      ? `url(${avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    border: '3px solid #E8C77A',
                    boxShadow: '0 0 25px rgba(232, 199, 122, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '2rem',
                  }}>
                    {!avatarUrl && (displayName || username).charAt(0).toUpperCase()}
                  </div>
                  {uploadingAvatar && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                      }} />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: '1px solid rgba(232, 199, 122, 0.35)',
                    background: 'rgba(232, 199, 122, 0.1)',
                    color: '#E8C77A',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: uploadingAvatar ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {uploadingAvatar ? 'Procesando...' : '📷 Cambiar Retrato de Aventurero'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>

              {/* Campo: Nombre en el Gremio */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#E8C77A',
                  marginBottom: '6px',
                }}>
                  <span>¿Bajo qué nombre te conocerán en el Gremio?</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    Visible en chats y perfiles
                  </span>
                </label>
                <input
                  type="text"
                  className="auth-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. Kaelen de Orión / Lyra Vance"
                  required
                  maxLength={50}
                  style={{
                    fontSize: '1rem',
                    borderColor: 'rgba(232, 199, 122, 0.4)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                />
                <p style={{
                  fontSize: '0.74rem',
                  color: 'rgba(232, 199, 122, 0.8)',
                  marginTop: '6px',
                  lineHeight: 1.4,
                }}>
                  ✦ <strong>Aviso del Escribano:</strong> Los miembros gratuitos no podrán cambiar este nombre una vez sellado. Cambiar tu nombre más adelante es un beneficio exclusivo de rangos Premium.
                </p>
              </div>

              {/* Campo: Identificador de usuario */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '6px',
                }}>
                  Identificador único (@username)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)', fontWeight: 700
                  }}>@</span>
                  <input
                    type="text"
                    className="auth-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="usuario_estelar"
                    required
                    minLength={3}
                    maxLength={30}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
              </div>

              {/* Campo: Lema / Juramento de Aventurero */}
              <div style={{ marginBottom: '26px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '6px',
                }}>
                  Juramento o Frase de Aventurero (Lema)
                </label>
                <textarea
                  className="auth-input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Que la luz cósmica guíe mi espada y mis transmisiones..."
                  rows={2}
                  maxLength={180}
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Botón de Sellado */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #E8C77A 0%, #D4AF37 50%, #996515 100%)',
                  color: '#1a1405',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  border: 'none',
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 8px 30px rgba(212, 175, 55, 0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.25s ease',
                  textTransform: 'uppercase',
                }}
              >
                {submitting ? (
                  <>
                    <span style={{
                      width: '18px', height: '18px', border: '2px solid rgba(26,20,5,0.3)',
                      borderTopColor: '#1a1405', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Grabando en los anales...</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} color="#1a1405" />
                    <span>✦ Sellar Inscripción en el Gremio ✦</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* FASE 2: LA TARJETA DE BIENVENIDA AL GREMIO (CARNET DE AVENTURERO)         */
          /* ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Mensaje de Celebración */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '20px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#34D399',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}>
                <Check size={14} color="#34D399" />
                ¡Inscripción Sellada con Éxito!
              </span>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '2rem',
                color: '#fff',
                margin: '0 0 8px',
              }}>
                Bienvenido al Gremio Estelar
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
                Aquí tienes tu carnet oficial de aventurero. Descárgalo para presumirlo o entra a explorar la taberna.
              </p>
            </div>

            {/* TARJETA / CARNET 3D HOLOGRÁFICO */}
            <div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #181433 0%, #0d0a1d 50%, #15102a 100%)',
                border: '3px solid #E8C77A',
                boxShadow: `
                  0 30px 90px rgba(0, 0, 0, 0.9),
                  0 0 45px rgba(232, 199, 122, 0.25),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                padding: '30px 24px',
                position: 'relative',
                transform: `perspective(1000px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
                transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
                overflow: 'hidden',
                color: '#fff',
              }}
            >
              {/* Brillo holográfico de fondo */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(232, 199, 122, 0.08) 0%, transparent 60%)',
                pointerEvents: 'none',
              }} />

              {/* Esquinas arcanas */}
              <div style={{ position: 'absolute', top: '10px', left: '12px', color: '#E8C77A', fontSize: '0.75rem' }}>❖</div>
              <div style={{ position: 'absolute', top: '10px', right: '12px', color: '#E8C77A', fontSize: '0.75rem' }}>❖</div>
              <div style={{ position: 'absolute', bottom: '10px', left: '12px', color: '#E8C77A', fontSize: '0.75rem' }}>❖</div>
              <div style={{ position: 'absolute', bottom: '10px', right: '12px', color: '#E8C77A', fontSize: '0.75rem' }}>❖</div>

              {/* Header de la tarjeta */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(232, 199, 122, 0.25)', paddingBottom: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#E8C77A', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.12em' }}>
                  <FourPointStar size={14} color="#E8C77A" />
                  GREMIO ESTELAR
                  <FourPointStar size={14} color="#E8C77A" />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '3px' }}>
                  Carnet Oficial de Aventurero
                </div>
              </div>

              {/* Retrato con Marco Dorado */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: avatarUrl
                    ? `url(${avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  border: '3px solid #E8C77A',
                  boxShadow: '0 0 30px rgba(232, 199, 122, 0.4), inset 0 0 15px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                }}>
                  {!avatarUrl && (displayName || username).charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Nombre y Rango */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.45rem',
                  color: '#fff',
                  margin: '0 0 4px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                }}>
                  {displayName || username}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#E8C77A', fontWeight: 700, marginBottom: '8px' }}>
                  @{username}
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.45)',
                  color: '#c084fc',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  ★ Iniciado de las Estrellas
                </span>
              </div>

              {/* Lema */}
              {bio && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  "{bio}"
                </div>
              )}

              {/* Ficha técnica del Gremio */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '14px',
                padding: '12px 16px',
                fontSize: '0.74rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>REGISTRO:</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>{memberId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>INGRESO:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{currentDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>ESTADO:</span>
                  <span style={{ color: '#34D399', fontWeight: 800 }}>✦ ACTIVO Y RECONOCIDO</span>
                </div>
              </div>

              {/* Sello de cera dorado */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#E8C77A', fontSize: '0.72rem', fontWeight: 700 }}>
                <Award size={14} color="#E8C77A" />
                <span>SELLO OFICIAL • AUTÉNTICO Y REGISTRADO</span>
              </div>
            </div>

            {/* Botones de acción post-inscripción */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%', maxWidth: '400px' }}>
              <button
                type="button"
                onClick={handleDownloadCard}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(232, 199, 122, 0.15)',
                  border: '1px solid rgba(232, 199, 122, 0.4)',
                  color: '#E8C77A',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                📥 Descargar Carnet
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 18px rgba(139, 92, 246, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                ✨ Entrar al Gremio →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de recorte de foto */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        cropType="avatar"
        title="Recortar Retrato de Aventurero"
        onCropComplete={handleCropComplete}
        onClose={() => setCropperOpen(false)}
      />
    </div>
  );
}
