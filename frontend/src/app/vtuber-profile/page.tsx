'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import { useSocketMedia } from '@/lib/hooks/useSocketMedia';
import { VTuberProfile, VTUBER_SURVEY_QUESTIONS, type SurveyAnswers } from '@gremio-estelar/shared';
import Link from 'next/link';
import Image from 'next/image';

function VtuberProfileEditor() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // All profile fields
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [description, setDescription] = useState('');
  const [lore, setLore] = useState('');
  const [fanName, setFanName] = useState('');
  const [oshiMark, setOshiMark] = useState('');
  const [contentType, setContentType] = useState('');
  const [streamSchedule, setStreamSchedule] = useState('');

  // Survey / Request states
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({});
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndWait } = useSocketMedia();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    const setUrl = type === 'avatar' ? setAvatarUrl : setBannerUrl;

    setUploading(true);
    try {
      // Non-blocking upload: sends to backend, gets processing ID, waits for media:ready event
      const url = await uploadAndWait(file, `/uploads/${type}`);
      setUrl(url);
      showToast('Imagen subida correctamente', 'success');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error al subir imagen'}`, 'error');
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  // Social links
  const [twitchUrl, setTwitchUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [kickUrl, setKickUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Theme color
  const THEME_COLORS = [
    { name: 'Púrpura', color: '#8a2be2' },
    { name: 'Rosa', color: '#ff007f' },
    { name: 'Azul', color: '#2196f3' },
    { name: 'Verde', color: '#00e676' },
    { name: 'Naranja', color: '#ff9800' },
    { name: 'Rojo', color: '#f44336' },
    { name: 'Cian', color: '#00bcd4' },
    { name: 'Oro', color: '#ffd700' },
  ];
  const [themeColor, setThemeColor] = useState('');

  // Arrays
  const [languagesInput, setLanguagesInput] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');


  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user?.vtuberProfile) {
      const p = user.vtuberProfile as VTuberProfile;
      setDisplayName(p.displayName || '');
      setAvatarUrl(p.avatarUrl || '');
      setBannerUrl(p.bannerUrl || '');
      setDescription(p.description || '');
      setLore(p.lore || '');
      setFanName(p.fanName || '');
      setOshiMark(p.oshiMark || '');
      setThemeColor(p.themeColor || '');
      setContentType(p.contentType || '');
      setStreamSchedule(p.streamSchedule || '');
      setTwitchUrl(p.twitchUrl || '');
      setYoutubeUrl(p.youtubeUrl || '');
      setKickUrl(p.kickUrl || '');
      setTiktokUrl(p.tiktokUrl || '');
      setTwitterUrl(p.twitterUrl || '');
      setDiscordUrl(p.discordUrl || '');
      setWebsiteUrl(p.websiteUrl || '');
      try {
        const langs = p.languages ? JSON.parse(p.languages) : [];
        setLanguagesInput(langs.join(', '));
      } catch { setLanguagesInput(''); }
      try {
        const tags = p.hashtags ? JSON.parse(p.hashtags) : [];
        setHashtagsInput(tags.join(', '));
      } catch { setHashtagsInput(''); }
    }
  }, [user, isLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const languages = languagesInput.split(',').map(s => s.trim()).filter(Boolean);
      const hashtags = hashtagsInput.split(',').map(s => s.trim()).filter(Boolean);

      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: displayName || undefined,
          avatarUrl: avatarUrl || undefined,
          bannerUrl: bannerUrl || undefined,
          description: description || undefined,
          lore: lore || undefined,
          fanName: fanName || undefined,
          oshiMark: oshiMark || undefined,
          themeColor: themeColor || undefined,
          contentType: contentType || undefined,
          streamSchedule: streamSchedule || undefined,
          twitchUrl: twitchUrl || undefined,
          youtubeUrl: youtubeUrl || undefined,
          kickUrl: kickUrl || undefined,
          tiktokUrl: tiktokUrl || undefined,
          twitterUrl: twitterUrl || undefined,
          discordUrl: discordUrl || undefined,
          websiteUrl: websiteUrl || undefined,
          languages: languages.length > 0 ? languages : undefined,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
        }),
      });
      showToast('Perfil VTuber actualizado', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Parse languages for preview
  let languagesList: string[] = [];
  try { if (languagesInput) languagesList = languagesInput.split(',').map(s => s.trim()).filter(Boolean); } catch {}

  const socialLinks = [
    { url: twitchUrl, label: 'Twitch', icon: 'TW', color: '#9146FF' },
    { url: youtubeUrl, label: 'YouTube', icon: 'YT', color: '#FF0000' },
    { url: kickUrl, label: 'Kick', icon: 'KC', color: '#53fc18' },
    { url: tiktokUrl, label: 'TikTok', icon: 'TK', color: '#00f2ea' },
    { url: twitterUrl, label: 'Twitter/X', icon: 'X', color: '#1DA1F2' },
    { url: discordUrl, label: 'Discord', icon: 'DC', color: '#5865F2' },
    { url: websiteUrl, label: 'Sitio Web', icon: 'WWW', color: 'var(--primary)' },
  ].filter(s => s.url);

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

  // ── Guard: solo VTubers oficiales pueden editar su perfil ──────────
  // Un usuario normal (role USER) que llegó aquí porque tenía un
  // VTuberProfile creado automáticamente por Discord/Google antes del
  // fix no debe ver el editor. Solo ve la pantalla de solicitud.
  const isOfficialVtuber = user.role === 'VTUBER' || user.vtuberProfile?.isApproved === true;

  return (
    <>
    {isOfficialVtuber ? (
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }}>
      {/* ===== HEADER ===== */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '4px' }}>
            Perfil VTuber
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Personaliza cómo te ve la comunidad
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/profile/${user.id}`} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Ver perfil público
          </Link>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '28px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
        padding: '4px', maxWidth: '320px',
      }}>
        <button
          onClick={() => setActiveTab('editor')}
          style={{
            flex: 1, padding: '10px 20px', borderRadius: '9px',
            border: 'none', cursor: 'pointer',
            background: activeTab === 'editor' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'editor' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.9rem',
            transition: 'all 0.2s',
          }}
        >
          ✎ Editor
        </button>
        <button
          onClick={() => { setShowPreview(!showPreview); setActiveTab('preview'); }}
          style={{
            flex: 1, padding: '10px 20px', borderRadius: '9px',
            border: 'none', cursor: 'pointer',
            background: activeTab === 'preview' && showPreview ? 'var(--primary)' : 'transparent',
            color: activeTab === 'preview' && showPreview ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.9rem',
            transition: 'all 0.2s',
          }}
        >
          👁️ Vista previa
        </button>
      </div>

      {/* ===== VISTA PREVIA ===== */}
      {showPreview && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            👁️ Así te ve la comunidad — Vista previa en vivo
          </div>

          {/* Banner preview - matches public profile exactly */}
          <div style={{
            position: 'relative', width: '100%',
            height: 'clamp(160px, 25vw, 280px)',
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover`
              : 'linear-gradient(135deg, #1a1040, #302b63)',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, var(--background) 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                border: '3px solid var(--background)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', color: 'white', fontWeight: 'bold',
                margin: '0 auto 12px', overflow: 'hidden', position: 'relative',
              }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={0} height={0} sizes="100vw" unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  (displayName || user.username).charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>

          {/* Profile info preview */}
          <div className="glass" style={{
            borderRadius: '0 0 16px 16px', borderTop: 'none',
            padding: '50px 24px 24px', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
              {displayName || user.username}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '12px' }}>
              @{user.username}
            </p>
            {oshiMark && <span style={{ marginRight: '10px', fontSize: '1.1rem' }}>{oshiMark}</span>}
            {fanName && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Fans: <strong style={{ color: 'var(--primary)' }}>{fanName}</strong>
              </span>
            )}
          </div>

          {/* Sections preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {description && (
              <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📝 Descripción
                </h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{description}</p>
              </div>
            )}
            {socialLinks.length > 0 && (
              <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔗 Redes Sociales
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {socialLinks.map((link) => (
                    <div key={link.label} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '10px',
                      background: `${link.color}15`,
                      color: link.color, fontSize: '0.85rem', fontWeight: 600,
                    }}>
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                      <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                        {link.url}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(streamSchedule || languagesList.length > 0) && (
              <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📡 Stream
                </h4>
                {streamSchedule && <p style={{ fontSize: '0.9rem', marginBottom: languagesList.length > 0 ? '12px' : 0 }}>{streamSchedule}</p>}
                {languagesList.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {languagesList.map(l => (
                      <span key={l} style={{
                        padding: '3px 10px', borderRadius: '12px',
                        background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
                        fontSize: '0.75rem', color: 'var(--accent)',
                      }}>{l}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== EDITOR FORM ===== */}
      <form onSubmit={handleSave}>
        {/* ===== AVATAR & BANNER ===== */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Avatar y Banner
          </h3>

          {/* Live preview of banner + avatar */}
          <div style={{
            width: '100%', height: '180px', borderRadius: '14px', marginBottom: '16px',
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover`
              : 'linear-gradient(135deg, #1a1040, #302b63, #1a1040)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(138,43,226,0.1), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.3)',
              background: avatarUrl
                ? `url(${avatarUrl}) center/cover`
                : 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', color: 'white', fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden', transition: 'transform 0.3s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">
                Avatar <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(URL)</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input
                  className="input"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.png"
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
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={e => handleFileSelect(e, 'avatar')}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Banner <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(URL)</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input
                  className="input"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://ejemplo.com/banner.png"
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
                    transition: 'all 0.2s',
                    opacity: uploadingBanner ? 0.6 : 1,
                  }}
                  title="Subir imagen"
                >
                  {uploadingBanner ? '...' : 'Subir'}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={e => handleFileSelect(e, 'banner')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== INFORMACIÓN BÁSICA ===== */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Información Basica
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre de VTuber</label>
              <div style={{ position: 'relative' }}>
                <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ej: Sakura Chan" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre de Fans</label>
              <div style={{ position: 'relative' }}>
                <input className="input" value={fanName} onChange={e => setFanName(e.target.value)}
                  placeholder="Ej: Estrellitas" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Oshi Mark</label>
              <div style={{ position: 'relative' }}>
                <input className="input" value={oshiMark} onChange={e => setOshiMark(e.target.value)}
                  placeholder="Oshi mark" maxLength={20} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo de Contenido</label>
              <div style={{ position: 'relative' }}>
                <input className="input" value={contentType} onChange={e => setContentType(e.target.value)}
                  placeholder="Ej: Gaming, Musica" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Tema de Color
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '4px' }}>
                  (elige un color para tu perfil)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {THEME_COLORS.map(tc => (
                  <button
                    key={tc.color}
                    type="button"
                    onClick={() => setThemeColor(themeColor === tc.color ? '' : tc.color)}
                    title={tc.name}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: tc.color,
                      border: themeColor === tc.color ? '3px solid white' : '2px solid transparent',
                      boxShadow: themeColor === tc.color ? `0 0 12px ${tc.color}80` : 'none',
                      cursor: 'pointer', transition: 'all 0.2s',
                      transform: themeColor === tc.color ? 'scale(1.15)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { if (themeColor !== tc.color) e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { if (themeColor !== tc.color) e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                ))}
              </div>
              {themeColor && (
                <div style={{
                  marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{
                    width: '14px', height: '14px', borderRadius: '4px',
                    background: themeColor, display: 'inline-block',
                  }} />
                  {themeColor}
                  <button type="button" onClick={() => setThemeColor('')} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.75rem', padding: '0',
                    textDecoration: 'underline',
                  }}>Quitar</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre ti..."
              style={{ minHeight: '100px', resize: 'vertical', borderRadius: '12px' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {description.length} caracteres · Visible en tu perfil público
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Lore / Historia de tu personaje
              <span style={{
                padding: '2px 8px', borderRadius: '8px',
                background: 'rgba(138,43,226,0.1)',
                fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)',
              }}>
                OPCIONAL
              </span>
            </label>
            <textarea className="input" value={lore} onChange={e => setLore(e.target.value)}
              placeholder="Cuenta la historia de tu personaje... ¿De dónde vienes? ¿Cuál es tu misión?"
              style={{ minHeight: '120px', resize: 'vertical', borderRadius: '12px', fontStyle: 'italic' }} />
          </div>
        </div>

        {/* ===== REDES SOCIALES ===== */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Redes Sociales
            <span style={{
              fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)',
            }}>
              (deja vacío lo que no uses)
            </span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#9146FF' }}>Twitch</label>
              <input className="input" value={twitchUrl} onChange={e => setTwitchUrl(e.target.value)}
                placeholder="https://twitch.tv/tuusuario" style={{ borderColor: 'rgba(145,65,255,0.2)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#FF0000' }}>YouTube</label>
              <input className="input" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@tuusuario" style={{ borderColor: 'rgba(255,0,0,0.2)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#53fc18' }}>Kick</label>
              <input className="input" value={kickUrl} onChange={e => setKickUrl(e.target.value)}
                placeholder="https://kick.com/tuusuario" style={{ borderColor: 'rgba(83,252,24,0.15)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#00f2ea' }}>TikTok</label>
              <input className="input" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@tuusuario" style={{ borderColor: 'rgba(0,242,234,0.2)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#1DA1F2' }}>Twitter / X</label>
              <input className="input" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/tuusuario" style={{ borderColor: 'rgba(29,161,242,0.2)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#5865F2' }}>Discord</label>
              <input className="input" value={discordUrl} onChange={e => setDiscordUrl(e.target.value)}
                placeholder="https://discord.gg/tu-invitacion" style={{ borderColor: 'rgba(88,101,242,0.2)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: 'var(--primary)' }}>Sitio Web</label>
              <input className="input" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://tusitio.com" style={{ borderColor: 'rgba(138,43,226,0.2)' }} />
            </div>
          </div>
        </div>

        {/* ===== STREAMING & OTROS ===== */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px', borderRadius: '16px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Streaming y Mas
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Horario de Streams</label>
              <input className="input" value={streamSchedule} onChange={e => setStreamSchedule(e.target.value)}
                placeholder="Ej: Lun-Mie 20:00 UTC" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Idiomas</label>
              <input className="input" value={languagesInput} onChange={e => setLanguagesInput(e.target.value)}
                placeholder="Español, Inglés, Japonés" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Separados por coma
              </span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hashtags</label>
              <input className="input" value={hashtagsInput} onChange={e => setHashtagsInput(e.target.value)}
                placeholder="vtuber, español, gaming" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Separados por coma, sin #
              </span>
            </div>
          </div>
        </div>

        {/* ===== BOTONES DE ACCIÓN ===== */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn"
            disabled={saving}
            style={{
              flex: '1', padding: '16px 24px', fontSize: '1.05rem',
              borderRadius: '14px', minWidth: '200px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              boxShadow: '0 0 30px rgba(138,43,226,0.2)',
            }}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block',
                }} />
                Guardando...
              </span>
            ) : (
              'Guardar Perfil VTuber'
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-outline"
            style={{
              padding: '16px 24px', fontSize: '1.05rem',
              borderRadius: '14px', minWidth: '160px',
              borderWidth: '2px',
            }}
          >
            {showPreview ? '✎ Volver al editor' : '👁️ Vista previa'}
          </button>

          {/* VTuber approved badge */}
          {user.vtuberProfile?.isApproved && user.role === 'VTUBER' && (
            <div
              className="glass"
              style={{
                flex: '1', padding: '16px 24px', borderRadius: '14px',
                textAlign: 'center', minWidth: '200px',
                background: 'rgba(0,230,118,0.08)',
                border: '1px solid rgba(0,230,118,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', fontSize: '1rem', fontWeight: 600, color: '#00e676',
              }}
            >
              Eres un VTuber Oficial
            </div>
          )}
        </div>

        <p style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '0.8rem', color: 'var(--text-muted)',
        }}>
          Los cambios se guardarán en tu perfil y serán visibles inmediatamente para la comunidad.
        </p>
      </form>

    </div>
    ) : (
      <div className="container" style={{
        paddingTop: '60px', paddingBottom: '40px',
        maxWidth: '600px', margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '3rem', marginBottom: '20px',
          opacity: 0.3, filter: 'grayscale(0.5)',
        }}>
          ✨
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
          ¿Quieres ser VTuber?
        </h1>
        <p style={{
          color: 'var(--text-muted)', fontSize: '1rem',
          lineHeight: 1.7, marginBottom: '32px',
        }}>
          Esta sección es exclusiva para VTubers oficiales del gremio.
          Si tienes un modelo VTuber y quieres unirte al grupo,
          envía tu solicitud y los administradores la evaluarán.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSurvey(true)}
            className="btn"
            style={{
              padding: '14px 32px', fontSize: '1.05rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ff007f, #ff9800)',
              boxShadow: '0 0 30px rgba(255,0,127,0.2)',
            }}
          >
            Solicitar ser VTuber Oficial
          </button>
          <Link href="/" className="btn btn-outline" style={{
            padding: '10px 24px', fontSize: '0.9rem',
            borderRadius: '10px',
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    )}

      {/* ===== SURVEY MODAL (available for both VTubers and applicants) ===== */}
      {showSurvey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass" style={{
            padding: '32px', borderRadius: '20px', width: '100%',
            maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Cuestionario VTuber</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Responde estas preguntas para que los admins evalúen tu solicitud
                </p>
              </div>
              <button onClick={() => setShowSurvey(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              {VTUBER_SURVEY_QUESTIONS.map((q) => (
                <div key={q.id} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', marginBottom: '6px' }}>
                    {q.question}
                    {q.required && <span style={{ color: 'var(--warm)', marginLeft: '4px' }}>*</span>}
                  </label>
                  {q.type === 'textarea' ? (
                    <textarea
                      className="input"
                      value={surveyAnswers[q.id] || ''}
                      onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder={q.placeholder}
                      style={{ minHeight: '70px', resize: 'vertical', borderRadius: '10px' }}
                    />
                  ) : (
                    <input
                      className="input"
                      value={surveyAnswers[q.id] || ''}
                      onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder={q.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSurvey(false)} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                Cancelar
              </button>
              <button
                onClick={async () => {
                  // Validate required fields
                  const missing = VTUBER_SURVEY_QUESTIONS
                    .filter(q => q.required && !surveyAnswers[q.id]?.trim())
                    .map(q => q.question);
                  if (missing.length > 0) {
                    showToast(`Responde: ${missing[0].substring(0, 50)}...`, 'error');
                    return;
                  }

                  setSubmittingRequest(true);
                  try {
                    await apiFetch('/vtubers/request', {
                      method: 'POST',
                      body: JSON.stringify({
                        displayName: displayName || user.username,
                        description: description || undefined,
                        avatarUrl: avatarUrl || undefined,
                        lore: lore || undefined,
                        surveyAnswers,
                      }),
                    });
                    showToast('Solicitud enviada. Los admins la evaluaran y recibiras una notificacion.', 'success');
                    setSurveyAnswers({});
                    setShowSurvey(false);
                  } catch (err: unknown) {
                    showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
                  } finally {
                    setSubmittingRequest(false);
                  }
                }}
                disabled={submittingRequest}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #ff007f, #ff9800)',
                  boxShadow: '0 0 20px rgba(255,0,127,0.2)',
                }}
              >
                {submittingRequest ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function VtuberProfilePage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
      <VtuberProfileEditor />
    </ClientOnly>
  );
}
