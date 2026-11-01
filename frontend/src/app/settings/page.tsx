'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import { useSocketMedia } from '@/lib/hooks/useSocketMedia';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Link from 'next/link';
import { hasAnyRole, isStaffRole } from '@gremio-estelar/shared';

import RoleBadge from '@/components/ui/RoleBadge';
import { parseUserRoles, getPrimaryRole, isSpotifyUrl, canUseProfileMusic, toSpotifyEmbedUrl, getSpotifyEmbedHeight, getEffectivePlan, planMeetsOrExceeds } from '@gremio-estelar/shared';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { normalizeUsername } from '@/lib/user-display';
import { getPlanAvatarBorder } from '@/lib/plan-avatar-border';

// ===== PROFILE MUSIC — TEMPORARILY DISABLED (flip to true to re-enable) =====
const PROFILE_MUSIC_ENABLED = false;

const AURA_PRESETS = [
  { id: 'violet', label: 'VIOLETA ESTELAR', hex: '#8b5cf6' },
  { id: 'cyan', label: 'CIAN CIBER', hex: '#06b6d4' },
  { id: 'crimson', label: 'CARMESÍ ECLIPSE', hex: '#dc2626' },
  { id: 'gold', label: 'ORO SOLAR', hex: '#f59e0b' },
  { id: 'emerald', label: 'ESMERALDA', hex: '#10b981' },
  { id: 'sakura', label: 'SAKURA NEÓN', hex: '#ec4899' },
];

const CANVAS_PRESETS = [
  { id: 'nebula', label: 'NEBULA DEEP', value: 'linear-gradient(180deg, #16132b 0%, #0d0b1a 100%)', tier: 'NOVA' },
  { id: 'cyber', label: 'CYBER GRID', value: 'linear-gradient(180deg, #0a1128 0%, #000411 100%)', tier: 'NOVA' },
  { id: 'crimson', label: 'CRIMSON ECLIPSE', value: 'linear-gradient(180deg, #220b16 0%, #0c0408 100%)', tier: 'NOVA' },
  { id: 'obsidian', label: 'OBSIDIAN VOID', value: 'linear-gradient(180deg, #121212 0%, #050505 100%)', tier: 'NOVA' },
  { id: 'aurora', label: 'AURORA MIST', value: 'linear-gradient(180deg, #0a1e1b 0%, #040e0d 100%)', tier: 'NOVA' },
  { id: 'imperial', label: 'ROYAL IMPERIAL', value: 'linear-gradient(180deg, #201704 0%, #0b0802 100%)', tier: 'STELLAR' },
];

function UserSettings() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [bannerColor, setBannerColor] = useState('#8b5cf6');
  const [bannerUrl, setBannerUrl] = useState('');
  const [displayedRole, setDisplayedRole] = useState('');
  const [profileMusic, setProfileMusic] = useState('');
  const originalProfileMusic = useRef('');
  const [profileBg, setProfileBg] = useState('linear-gradient(180deg, #16132b 0%, #0d0b1a 100%)');
  const [profileParticles, setProfileParticles] = useState('OFF');
  const [activeTab, setActiveTab] = useState<'profile' | 'card'>('profile');
  const [saving, setSaving] = useState(false);
  const [togglingFrame, setTogglingFrame] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { uploadAndWait } = useSocketMedia();

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'banner'>('avatar');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Delete my account (danger zone)
  const [mounted, setMounted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' = 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempUrl = URL.createObjectURL(file);
    setCropperSrc(tempUrl);
    setCropperType(type);
    setCropperOpen(true);
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    const type = cropperType;
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    const setUrl = type === 'avatar' ? setAvatarUrl : setBannerUrl;

    setUploading(true);
    try {
      const isGif = croppedBlob.type === 'image/gif';
      const ext = isGif ? 'gif' : 'webp';
      const mimeType = isGif ? 'image/gif' : 'image/webp';
      const croppedFile = new File([croppedBlob], `${type}_${Date.now()}.${ext}`, { type: mimeType });
      const url = await uploadAndWait(croppedFile, `/uploads/${type}`);
      setUrl(url);
      showToast(`${type === 'avatar' ? 'Foto de perfil' : 'Banner'} ${isGif ? 'actualizado (GIF animado conservado)' : 'recortado y actualizado'}`, 'success');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error al subir la imagen recortada'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCropExisting = () => {
    if (!avatarUrl) return;
    setCropperSrc(avatarUrl);
    setCropperType('avatar');
    setCropperOpen(true);
  };



  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
      setBio(user.bio || '');
      setBannerColor(user.bannerColor || '#8b5cf6');
      setBannerUrl((user as any).bannerUrl || (user as any).vtuberProfile?.bannerUrl || '');
      setDisplayedRole(user.displayedRole || '');
      setProfileMusic(user.profileMusic || '');
      originalProfileMusic.current = user.profileMusic || '';
      setProfileBg((user as any).profileBg || 'linear-gradient(180deg, #16132b 0%, #0d0b1a 100%)');
      setProfileParticles((user as any).profileParticles || 'OFF');
    }
  }, [user, isLoading, router]);

  // ── Marco premium del plan (aro dorado STELLAR / morado NOVA / azul ASTRO) ──
  const togglePlanFrame = async () => {
    const nextHidden = !(user?.profileFrame === 'OFF');
    setTogglingFrame(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ profileFrame: nextHidden ? 'OFF' : 'PLAN' }),
      });
      showToast(nextHidden ? 'Marco del plan quitado' : 'Marco del plan equipado', 'success');
      window.dispatchEvent(new Event('user-refetched'));
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
    } finally {
      setTogglingFrame(false);
    }
  };

  const handleRemoveMusic = async () => {
    setSaving(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ profileMusic: null }),
      });
      setProfileMusic('');
      originalProfileMusic.current = '';
      showToast('Música de perfil eliminada', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          bio: bio.trim() || undefined,
          bannerColor: bannerColor || undefined,
          bannerUrl: bannerUrl.trim() || null,
          displayedRole: displayedRole || undefined,
          profileMusic: profileMusic.trim() || null,
          profileBg: profileBg || undefined,
          profileParticles: profileParticles || undefined,
        }),
      });
      showToast('Perfil actualizado correctamente', 'success');
      // Refresh user data in AuthContext by re-fetching
      const profile = await apiFetch('/users/me');
      // Force reload to update AuthContext cache
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (normalizeUsername(deleteConfirmName) !== user.username) {
      showToast('El nombre de usuario no coincide con tu cuenta', 'error');
      return;
    }
    setDeleting(true);
    try {
      await apiFetch('/users/me', { method: 'DELETE' });
      showToast('Tu cuenta ha sido eliminada. ¡Hasta pronto!', 'success');
      setDeleteOpen(false);
      await logout();
      router.push('/');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error al eliminar la cuenta'}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return (
    <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
      <span style={{
        width: '24px', height: '24px',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }} />
    </div>
  );
  if (!user) return null;

  const effectivePlan = getEffectivePlan(user.plan, user.role);
  const canBannerGif = planMeetsOrExceeds(user.plan, user.role, 'NOVA');
  const planFrameHidden = user?.profileFrame === 'OFF';
  const planBorder = getPlanAvatarBorder(user?.plan, user?.role);

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: activeTab === 'card' ? '1040px' : '720px', margin: '0 auto', transition: 'max-width 0.25s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>
          Configuración
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Personaliza tu perfil público
        </p>
      </div>

      {hasAnyRole(user.role, ['VTUBER', 'STREAMER', 'MAID']) && (
        <div style={{
          padding: '14px 18px', borderRadius: '14px', marginBottom: '24px',
          background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <span style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Eres un creador oficial. Para editar tus datos de VTuber (lore, directo, redes) o de Streamer (horarios, plataformas), accede a tu panel de creador.
          </span>
          <Link href={hasAnyRole(user.role, ['VTUBER', 'MAID']) ? "/vtuber-profile" : "/streamer-profile"} style={{ padding: '6px 14px', borderRadius: '8px', background: '#38bdf8', color: '#000', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
            Ir a Perfil {hasAnyRole(user.role, ['VTUBER', 'MAID']) ? 'VTuber' : 'Streamer'} →
          </Link>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '24px',
        padding: '5px', borderRadius: '14px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1, padding: '11px 18px', borderRadius: '10px',
            background: activeTab === 'profile' ? 'rgba(255,255,255,0.09)' : 'transparent',
            border: activeTab === 'profile' ? '1px solid rgba(255,255,255,0.16)' : '1px solid transparent',
            color: activeTab === 'profile' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
            letterSpacing: '0.04em', textTransform: 'uppercase'
          }}
        >
          Perfil General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          style={{
            flex: 1, padding: '11px 18px', borderRadius: '10px',
            background: activeTab === 'card' ? 'rgba(139,92,246,0.18)' : 'transparent',
            border: activeTab === 'card' ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
            color: activeTab === 'card' ? '#f5f3ff' : 'var(--text-muted)',
            fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          Tarjeta VIP
          <span style={{
            fontSize: '0.62rem', padding: '2px 7px', borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', fontWeight: 800, letterSpacing: '0.05em'
          }}>
            PRO
          </span>
        </button>
      </div>

      {activeTab === 'profile' ? (
      <form onSubmit={handleSave}>
        {/* Avatar section */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Foto de perfil
          </h3>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: avatarUrl
                ? `url(${avatarUrl}) center/cover`
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1.6rem',
              overflow: 'hidden', flexShrink: 0,
              transition: 'transform 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="input"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="URL de imagen o sube una"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
                    cursor: uploadingAvatar ? 'wait' : 'pointer',
                    fontSize: '0.85rem', whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    opacity: uploadingAvatar ? 0.6 : 1,
                  }}
                  title="Subir imagen"
                >
                  {uploadingAvatar ? '...' : 'Subir'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleCropExisting}
                    style={{
                      padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid rgba(139,92,246,0.3)',
                      background: 'rgba(139,92,246,0.12)', color: 'var(--primary)',
                      cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap',
                      fontWeight: 600, transition: 'all 0.2s',
                    }}
                    title="Recortar y editar foto actual"
                  >
                    Recortar
                  </button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={(hasAnyRole(user.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER', 'HELPER', 'VIP_ASTRO', 'VIP_NOVA', 'VIP_STELLAR']) || user.plan !== 'FREE') ? "image/jpeg,image/png,image/webp,image/gif" : "image/jpeg,image/png,image/webp"}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Formatos: JPEG, PNG, WebP{(hasAnyRole(user.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER', 'HELPER', 'VIP_ASTRO', 'VIP_NOVA', 'VIP_STELLAR']) || user.plan !== 'FREE') && ' o GIF'}. Se recomienda 400x400px o superior.
                {(!hasAnyRole(user.role, ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER', 'HELPER', 'VIP_ASTRO', 'VIP_NOVA', 'VIP_STELLAR']) && user.plan === 'FREE') && <span style={{ display: 'block', color: 'var(--accent)', marginTop: '4px' }}>✨ Subir GIFs animados es exclusivo de miembros Premium.</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Banner Image & Color */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Imagen y Color del Banner
          </h3>

          {/* Banner image preview */}
          {bannerUrl && (
            <div style={{
              width: '100%', height: '120px', borderRadius: '12px', marginBottom: '14px',
              background: `url(${bannerUrl}) center/cover`,
              border: '1px solid rgba(255,255,255,0.1)',
            }} />
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Imagen de Banner (URL o Subir)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="input"
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
                placeholder="URL de imagen de banner"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                style={{
                  padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
                  cursor: uploadingBanner ? 'wait' : 'pointer',
                  fontSize: '0.85rem', whiteSpace: 'nowrap',
                  opacity: uploadingBanner ? 0.6 : 1,
                }}
              >
                {uploadingBanner ? '...' : 'Subir'}
              </button>
              {bannerUrl && bannerUrl !== avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCropperSrc(bannerUrl);
                    setCropperType('banner');
                    setCropperOpen(true);
                  }}
                  style={{
                    padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid rgba(139,92,246,0.3)',
                    background: 'rgba(139,92,246,0.12)', color: 'var(--primary)',
                    cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                >
                  Recortar
                </button>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept={canBannerGif ? "image/jpeg,image/png,image/webp,image/gif" : "image/jpeg,image/png,image/webp"}
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e, 'banner')}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {canBannerGif
                ? '✨ Puedes subir banners animados (GIF) — beneficio Nova Pro / Stellar Elite.'
                : 'Los banners animados (GIF) son exclusivos de Nova Pro y Stellar Elite. Sube JPEG, PNG o WebP.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="color"
              value={bannerColor}
              onChange={(e) => setBannerColor(e.target.value)}
              style={{
                width: '60px', height: '40px', padding: 0,
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: 'none'
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Color de fondo alternativo para tu banner</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Se mostrará en la parte superior de tu perfil si no hay imagen de banner.
              </p>
            </div>
          </div>
        </div>

        {/* Marco Premium del Plan (aro dorado STELLAR / morado NOVA / azul ASTRO) */}
        {effectivePlan !== 'FREE' && planBorder && (
          <div className="glass" style={{
            padding: '24px', marginBottom: '20px', borderRadius: '16px',
            border: planFrameHidden
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,215,0,0.35)',
            boxShadow: planFrameHidden ? 'none' : '0 4px 24px rgba(255,215,0,0.12)',
          }}>
            <h3 style={{
              fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            }}>
              Marco de Avatar Premium
              <span style={{
                fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px',
                background: planFrameHidden ? 'rgba(255,255,255,0.08)' : 'rgba(255,215,0,0.18)',
                color: planFrameHidden ? 'var(--text-muted)' : '#ffd700',
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {planFrameHidden ? 'Oculto' : 'Activo'}
              </span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Aro de avatar exclusivo del Plan {effectivePlan}. Se muestra en tu avatar cuando no tienes
              otro marco equipado de la tienda. Puedes quitarlo o volver a equiparlo cuando quieras.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Aro de vista previa */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                padding: '3px', flexShrink: 0,
                background: planBorder.bg,
                animation: planBorder.spin ? 'spin 4s linear infinite' : 'none',
                boxShadow: `0 0 16px ${planBorder.glow}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: planFrameHidden ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e1b4b, #31104b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', color: '#fff',
                }}>
                  👤
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  Aro de avatar de tu plan
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {planFrameHidden
                    ? 'Actualmente oculto. Pulsa equipar para volver a lucirlo.'
                    : 'Visible en tu avatar en toda la plataforma.'}
                </div>
              </div>

              <button
                type="button"
                onClick={togglePlanFrame}
                disabled={togglingFrame}
                style={{
                  padding: '10px 20px', borderRadius: '10px', flexShrink: 0,
                  border: planFrameHidden
                    ? '1px solid rgba(255,215,0,0.5)'
                    : '1px solid rgba(255,255,255,0.2)',
                  background: planFrameHidden
                    ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(245,158,11,0.25))'
                    : 'rgba(255,255,255,0.06)',
                  color: planFrameHidden ? '#ffd700' : '#fff',
                  cursor: togglingFrame ? 'wait' : 'pointer',
                  fontWeight: 800, fontSize: '0.85rem',
                  transition: 'all 0.2s', opacity: togglingFrame ? 0.6 : 1,
                }}
              >
                {togglingFrame ? '...' : planFrameHidden ? 'Equipar' : 'Quitar'}
              </button>
            </div>
          </div>
        )}

        {/* Preferred Display Badge (when user has multiple roles or an approved creator profile) */}
        {user && (() => {
          const accountRoles = parseUserRoles(user.role);
          const displayableRoles = Array.from(new Set([
            ...accountRoles,
            ...(user.vtuberProfile?.isApproved ? ['VTUBER'] : []),
            ...((user as any).streamerProfile?.isApproved ? ['STREAMER'] : []),
          ]));
          if (displayableRoles.length < 2) return null;
          const effectiveShownRole = displayedRole
            || (user.vtuberProfile?.isApproved ? 'VTUBER' : (user as any).streamerProfile?.isApproved ? 'STREAMER' : getPrimaryRole(user.role, null));
          return (
            <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
              <h3 style={{
                fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '8px', color: '#f5e6d3'
              }}>
                Insignia Principal Visible en Publicaciones
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Selecciona cuál de tus roles deseas mostrar al lado de tu nombre en el Feed, comentarios y el widget de perfil:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {displayableRoles.map((r) => {
                  const isSelected = effectiveShownRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDisplayedRole(r)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #d4a030' : '1px solid rgba(255,255,255,0.1)',
                        background: isSelected ? 'rgba(212,160,48,0.15)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <RoleBadge role={r} size="sm" />
                      {isSelected && <span style={{ color: '#d4a030', fontWeight: 800, fontSize: '0.9rem' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Profile Background Music (Spotify — NOVA & STELLAR Premium Feature) — DISABLED (PROFILE_MUSIC_ENABLED = false) */}
        {PROFILE_MUSIC_ENABLED && (() => {
          const isEligibleForMusic = canUseProfileMusic(user?.plan, user?.role);
          const musicTrimmed = profileMusic.trim();
          const musicIsSpotify = !musicTrimmed || isSpotifyUrl(musicTrimmed);
          const musicChanged = musicTrimmed !== originalProfileMusic.current;
          const isLegacyKeep = !!musicTrimmed && !musicIsSpotify && !musicChanged;
          const musicEmbed = musicTrimmed && isSpotifyUrl(musicTrimmed) ? toSpotifyEmbedUrl(musicTrimmed) : null;
          return (
            <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px', border: '1px solid rgba(29, 185, 84, 0.25)' }}>
              <h3 style={{
                fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '8px', color: '#1db954'
              }}>
                Música de Fondo para tu Perfil (Beneficio Premium NOVA / STELLAR)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Pega el enlace de una <strong style={{ color: '#4ade80' }}>canción, álbum o playlist de Spotify</strong>.
                Quienes visiten tu perfil podrán escucharla con el reproductor oficial de Spotify embebido.
              </p>

              {isEligibleForMusic ? (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e9d5ff', fontWeight: 700 }}>Enlace de Spotify</label>
                  <input
                    className="input"
                    value={profileMusic}
                    onChange={e => setProfileMusic(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    style={musicTrimmed && !musicIsSpotify ? { borderColor: '#ef4444' } : undefined}
                  />
                  {musicTrimmed && !musicIsSpotify && isLegacyKeep && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>
                      ℹ️ Formato anterior (MP3/directo): se conservará tal cual. Para cambiarla usa un enlace de Spotify.
                    </p>
                  )}
                  {musicTrimmed && !musicIsSpotify && !isLegacyKeep && (
                    <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '6px', fontWeight: 600 }}>
                      ⚠️ Solo se permiten enlaces de Spotify (canción, álbum o playlist).
                    </p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Cómo obtenerlo: en Spotify toca ⋯ → Compartir → Copiar enlace de la canción/álbum/playlist.
                    Dejar en blanco para desactivar.
                  </p>

                  {/* Live preview */}
                  {musicEmbed && (
                    <div style={{
                      marginTop: '14px', borderRadius: '14px', overflow: 'hidden',
                      border: '1px solid rgba(29, 185, 84, 0.35)', background: '#121212',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', fontSize: '0.72rem', color: '#4ade80', fontWeight: 700,
                        background: 'rgba(29, 185, 84, 0.1)',
                      }}>
                        <span>🟢 Vista previa del reproductor</span>
                      </div>
                      <iframe
                        src={musicEmbed}
                        width="100%"
                        height={getSpotifyEmbedHeight(musicEmbed)}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title="Vista previa de música de perfil"
                        style={{ border: 'none', display: 'block' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '14px 18px', borderRadius: '14px', background: 'rgba(147, 51, 234, 0.1)',
                  border: '1px solid rgba(147, 51, 234, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#e9d5ff', fontWeight: 600 }}>
                    🔒 La Música en el Perfil es exclusiva de los Planes Premium NOVA y STELLAR.
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {originalProfileMusic.current && (
                      <button
                        type="button"
                        onClick={handleRemoveMusic}
                        disabled={saving}
                        style={{
                          padding: '8px 16px', fontSize: '0.82rem',
                          background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                          fontWeight: 700, borderRadius: '10px', cursor: 'pointer',
                          border: '1px solid rgba(239, 68, 68, 0.4)', textDecoration: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Quitar música
                      </button>
                    )}
                    <Link href="/premium" className="btn" style={{ padding: '8px 16px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #9333ea, #c084fc)', color: '#fff', fontWeight: 700, borderRadius: '10px', textDecoration: 'none' }}>
                      Obtener Plan NOVA →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Basic info */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Información básica
          </h3>

          <div className="form-group">
            <label className="form-label">
              Nombre para mostrar
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '6px' }}>
                (opcional — si no pones nada, se usará tu nombre de usuario)
              </span>
            </label>
            <input
              className="input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user.username}
              maxLength={50}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">
              Nombre de usuario
            </label>
            <input
              className="input"
              value={user.username}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              El nombre de usuario no se puede cambiar por ahora.
            </p>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">
              Biografía / Descripción
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '6px' }}>
                (opcional)
              </span>
            </label>
            <textarea
              className="input"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Cuéntale a la comunidad quién eres..."
              maxLength={500}
              style={{ minHeight: '100px', resize: 'vertical', borderRadius: '12px' }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px',
            }}>
              <span>{bio.length} caracteres · Visible en tu perfil público</span>
              {bio.length > 500 && <span style={{ color: 'var(--warm)' }}>Máximo 500 caracteres</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn"
            disabled={saving}
            style={{
              flex: 1, padding: '14px 24px', fontSize: '1rem',
              borderRadius: '12px', minWidth: '200px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              boxShadow: '0 0 30px rgba(138,43,226,0.2)',
            }}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block',
                }} />
                Guardando...
              </span>
            ) : 'Guardar cambios'}
          </button>
          <Link
            href={`/profile/${user.id}`}
            className="btn btn-outline"
            style={{
              padding: '14px 24px', fontSize: '1rem',
              borderRadius: '12px', minWidth: '160px',
              borderWidth: '2px', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            Ver mi perfil
          </Link>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '0.8rem', color: 'var(--text-muted)',
        }}>
          Los cambios se guardarán y serán visibles inmediatamente para la comunidad.
        </p>
      </form>
      ) : (
        /* ── VIP Card Customizer Tab ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
          {/* Left Column: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Notice if Free plan */}
            {!planMeetsOrExceeds(user.plan, user.role, 'ASTRO') && (
              <div style={{
                padding: '16px 20px', borderRadius: '14px',
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  MODO VISTA PREVIA // PLAN REQUERIDO
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 14px', lineHeight: 1.5 }}>
                  Prueba y visualiza en tiempo real el aura y los lienzos de tu tarjeta. Para guardar la personalización de forma permanente, adquiere el Plan Astro o superior.
                </p>
                <Link
                  href="/premium"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: '#fff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  Ver Planes Estelares →
                </Link>
              </div>
            )}

            {/* 1. Aura & Resplandor */}
            <div className="glass" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                // 01 AURA & ILLUMINATION
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                Aura & Resplandor Perimetral
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                Color del resplandor exterior, bordes lumínicos e iluminación que envolverán tu tarjeta cuando otros usuarios abran tu perfil.
              </p>

              {/* Swatches */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                {AURA_PRESETS.map((preset) => {
                  const isSelected = bannerColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setBannerColor(preset.hex)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '10px',
                        background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? `1.5px solid ${preset.hex}` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? `0 0 14px ${preset.hex}44` : 'none',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <span style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: preset.hex, boxShadow: `0 0 8px ${preset.hex}`,
                        flexShrink: 0
                      }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? '#fff' : 'var(--text-muted)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                          {preset.label}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                          {preset.hex}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Picker */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <input
                  type="color"
                  value={bannerColor.startsWith('#') && bannerColor.length === 7 ? bannerColor : '#8b5cf6'}
                  onChange={(e) => setBannerColor(e.target.value)}
                  style={{
                    width: '32px', height: '32px', padding: 0,
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    background: 'none'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>Color personalizado (Hex)</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Elige cualquier color exacto de la rueda</div>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: bannerColor, fontWeight: 700 }}>
                  {bannerColor.toUpperCase()}
                </span>
              </div>
            </div>

            {/* 2. Fondo de la Tarjeta */}
            <div className="glass" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  // 02 CANVAS THEME
                </div>
                <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800 }}>
                  NOVA PRO+
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                Lienzo de Fondo
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                Gradiente envolvente y textura visual del cuerpo principal de la tarjeta.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
                {CANVAS_PRESETS.map((preset) => {
                  const isSelected = profileBg === preset.value;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfileBg(preset.value)}
                      style={{
                        padding: '10px', borderRadius: '10px',
                        background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <div style={{
                        height: '24px', borderRadius: '6px', marginBottom: '8px',
                        background: preset.value, border: '1px solid rgba(255,255,255,0.1)'
                      }} />
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: preset.tier === 'STELLAR' ? '#fbbf24' : '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                        {preset.tier}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Banner */}
            <div className="glass" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                // 03 HEADER DISPLAY
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                Banner de Cabecera
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                Imagen o animación de la cabecera. {canBannerGif ? 'Banners animados en formato GIF habilitados.' : 'Banners animados en GIF disponibles con Nova Pro o Stellar Elite.'}
              </p>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  className="input"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="URL de imagen o banner"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  style={{
                    padding: '10px 16px', borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.06)', color: '#fff',
                    cursor: uploadingBanner ? 'wait' : 'pointer',
                    fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
                  }}
                >
                  {uploadingBanner ? '...' : 'Subir'}
                </button>
              </div>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  style={{
                    background: 'none', border: 'none', color: '#f87171',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0
                  }}
                >
                  Restablecer a color de fondo
                </button>
              )}
            </div>

            {/* 4. Cosmic FX */}
            <div className="glass" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                  // 04 COSMIC PARTICLES
                </div>
                <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 800 }}>
                  STELLAR ELITE
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                Partículas Cósmicas
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                Micro-destellos estelares sobre la tarjeta al abrirse.
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setProfileParticles('OFF')}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                    background: profileParticles === 'OFF' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                    border: profileParticles === 'OFF' ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    color: profileParticles === 'OFF' ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  DESACTIVADO
                </button>
                <button
                  type="button"
                  onClick={() => setProfileParticles('COSMIC')}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                    background: profileParticles === 'COSMIC' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.02)',
                    border: profileParticles === 'COSMIC' ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                    color: profileParticles === 'COSMIC' ? '#fbbf24' : 'var(--text-muted)',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  ACTIVADO
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Sticky Preview */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div style={{
              fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 800,
              color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px',
              textAlign: 'center'
            }}>
              // VISTA PREVIA EN TIEMPO REAL
            </div>

            {/* Simulated Live Card */}
            <div style={{
              width: '100%', maxWidth: '350px', margin: '0 auto',
              borderRadius: '20px',
              background: profileBg,
              border: `1px solid ${bannerColor}44`,
              boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 50px ${bannerColor}33`,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease',
            }}>
              {/* Banner section */}
              <div style={{
                position: 'relative', height: bannerUrl ? '120px' : '90px',
                background: bannerUrl ? `url("${bannerUrl}") center/cover no-repeat` : bannerColor,
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,13,27,0.85) 100%)',
                }} />
              </div>

              {/* Body */}
              <div style={{ padding: '0 20px 20px', textAlign: 'center', marginTop: '-36px', position: 'relative' }}>
                {/* Avatar */}
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  margin: '0 auto 10px',
                  padding: planBorder ? '3px' : '0',
                  background: planBorder ? planBorder.bg : 'transparent',
                  boxShadow: `0 0 20px ${bannerColor}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '1.4rem',
                    border: '2px solid rgba(15,13,27,0.9)'
                  }}>
                    {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Name & Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    {displayName || user.username}
                  </span>
                  <RoleBadge role={displayedRole || getPrimaryRole(user.role, null)} size="sm" />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  @{user.username}
                </div>

                {/* Bio Preview */}
                {bio && (
                  <p style={{
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)',
                    margin: '10px auto 14px', maxWidth: '280px',
                    lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {bio}
                  </p>
                )}

                {/* Stats Row */}
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: '0',
                  margin: '14px 0',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}>
                  {[
                    { value: ((user as any)?._count?.followers || 0).toLocaleString('es-ES'), label: 'Seguidores' },
                    { value: ((user as any)?._count?.following || 0).toLocaleString('es-ES'), label: 'Siguiendo' },
                    { value: (((user as any)?.level || 1) as number).toLocaleString('es-ES'), label: 'Nivel' },
                    { value: (((user as any)?.xp || 0) as number).toLocaleString('es-ES'), label: 'XP' },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      flex: 1, textAlign: 'center', padding: '10px 4px',
                      borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                    }}>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px', fontWeight: 600 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    padding: '9px 16px', borderRadius: '10px',
                    background: `linear-gradient(135deg, ${bannerColor}, var(--secondary))`,
                    color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    Seguir
                  </div>
                  <div style={{
                    padding: '8px 16px', borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff', fontSize: '0.78rem', fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    Ver perfil completo
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn"
                style={{
                  width: '100%', maxWidth: '350px', padding: '13px 20px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  boxShadow: `0 0 25px ${bannerColor}44`,
                  fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em'
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Apariencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone — Delete my account */}
      {!isStaffRole(user.role) && activeTab === 'profile' && (
        <div className="glass" style={{
          marginTop: '32px', padding: '24px', borderRadius: '16px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171',
          }}>
            Zona de peligro
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
            Eliminar tu cuenta borrará <strong style={{ color: '#f87171' }}>permanentemente</strong> tu perfil,
            posts, comentarios, gremios, eventos, saldo de Stardust y todo tu historial.
            Esta acción <strong style={{ color: '#f87171' }}>no se puede deshacer</strong>.
          </p>
          <button
            type="button"
            onClick={() => { setDeleteConfirmName(''); setDeleteOpen(true); }}
            style={{
              padding: '11px 20px', borderRadius: '10px', cursor: 'pointer',
              background: 'rgba(239,68,68,0.15)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.45)', fontWeight: 800, fontSize: '0.88rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
          >
            Eliminar cuenta permanentemente
          </button>
        </div>
      )}

      {/* VS Disclaimer */}
      <div className="glass" style={{
        marginTop: '32px', padding: '20px', borderRadius: '16px',
        background: 'rgba(139,92,246,0.05)',
        border: '1px solid rgba(139,92,246,0.1)',
      }}>
        <h4 style={{
          fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          ¿Eres VTuber o Creador?
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
          Si tienes un personaje VTuber con modelo, puedes solicitar ser VTuber oficial
          y acceder a todas las herramientas de personalización.
        </p>
        <Link
          href="/vtuber-profile"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff007f, #ff9800)',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,0,127,0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          Solicitar ser VTuber
        </Link>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        cropType={cropperType}
        title={cropperType === 'avatar' ? 'Editar Foto de Perfil' : 'Editar Banner de Perfil'}
        onCropComplete={handleCropComplete}
        onClose={() => setCropperOpen(false)}
      />

      {/* Delete Account Confirmation Modal */}
      {mounted && deleteOpen && user && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px',
        }} onClick={() => setDeleteOpen(false)}>
          <div className="glass" style={{
            padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '460px',
            border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>Eliminar mi cuenta</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Esta acción es permanente e irreversible.</p>
              </div>
              <button onClick={() => setDeleteOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '16px', marginBottom: '20px', fontSize: '0.88rem', color: '#fca5a5', lineHeight: 1.6 }}>
              Se eliminará permanentemente tu cuenta <strong>@{user.username}</strong> junto con todos tus
              posts, comentarios, likes, seguidores, amigos, mensajes, gremios, eventos, donaciones y saldo de ⭐.
              Esta acción <strong>no se puede deshacer</strong>.
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ color: '#f87171', fontWeight: 800 }}>
                Escribe <span style={{ color: '#fff' }}>@{user.username}</span> para confirmar
              </label>
              <input
                className="input"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={`@${user.username}`}
                autoFocus
                style={{ marginTop: '6px', borderColor: 'rgba(239,68,68,0.4)' }}
                onKeyDown={e => { if (e.key === 'Enter' && normalizeUsername(deleteConfirmName) === user.username && !deleting) handleDeleteAccount(); }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
              <button
                onClick={handleDeleteAccount}
                className="btn"
                disabled={deleting || normalizeUsername(deleteConfirmName) !== user.username}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', fontWeight: 800,
                  opacity: normalizeUsername(deleteConfirmName) === user.username ? 1 : 0.5,
                  cursor: normalizeUsername(deleteConfirmName) === user.username ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
        <UserSettings />
      </ClientOnly>
    </ErrorBoundary>
  );
}
