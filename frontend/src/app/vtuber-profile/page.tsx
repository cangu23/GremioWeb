'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import { VTuberProfile } from '@gremio-estelar/shared';

function VtuberProfileEditor() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

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
  const [isLive, setIsLive] = useState(false);

  // Social links
  const [twitchUrl, setTwitchUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [kickUrl, setKickUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

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
      setContentType(p.contentType || '');
      setStreamSchedule(p.streamSchedule || '');
      setIsLive(p.isLive || false);
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
          contentType: contentType || undefined,
          streamSchedule: streamSchedule || undefined,
          isLive,
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
      showToast('Perfil VTuber actualizado ✅', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '24px' }}>🎭 Perfil VTuber</h1>

      <form onSubmit={handleSave}>
        {/* Avatar & Banner Preview */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{
            width: '100%', height: '160px', borderRadius: '12px', marginBottom: '16px',
            background: bannerUrl ? `url(${bannerUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)',
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: 'white', fontWeight: 'bold',
            }}>
              {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">URL del Avatar</label>
              <input className="input" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">URL del Banner</label>
              <input className="input" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Información Básica</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Nombre de VTuber</label>
              <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ej: Sakura Chan" />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre de Fans</label>
              <input className="input" value={fanName} onChange={e => setFanName(e.target.value)} placeholder="Ej: Estrellitas" />
            </div>
            <div className="form-group">
              <label className="form-label">Oshi Mark</label>
              <input className="input" value={oshiMark} onChange={e => setOshiMark(e.target.value)} placeholder="⭐" maxLength={20} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Contenido</label>
              <input className="input" value={contentType} onChange={e => setContentType(e.target.value)} placeholder="Ej: Gaming, Música, Arte" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="input" style={{ minHeight: '100px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Cuéntale a la comunidad sobre ti..." />
          </div>
          <div className="form-group">
            <label className="form-label">Lore / Historia</label>
            <textarea className="input" style={{ minHeight: '120px', resize: 'vertical' }} value={lore} onChange={e => setLore(e.target.value)} placeholder="La historia de tu personaje..." />
          </div>
        </div>

        {/* Social Links */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Redes Sociales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">🎮 Twitch</label>
              <input className="input" value={twitchUrl} onChange={e => setTwitchUrl(e.target.value)} placeholder="https://twitch.tv/..." />
            </div>
            <div className="form-group">
              <label className="form-label">▶️ YouTube</label>
              <input className="input" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div className="form-group">
              <label className="form-label">🎬 Kick</label>
              <input className="input" value={kickUrl} onChange={e => setKickUrl(e.target.value)} placeholder="https://kick.com/..." />
            </div>
            <div className="form-group">
              <label className="form-label">🎵 TikTok</label>
              <input className="input" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/..." />
            </div>
            <div className="form-group">
              <label className="form-label">🐦 Twitter/X</label>
              <input className="input" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="https://x.com/..." />
            </div>
            <div className="form-group">
              <label className="form-label">💬 Discord</label>
              <input className="input" value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." />
            </div>
            <div className="form-group">
              <label className="form-label">🌐 Sitio Web</label>
              <input className="input" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Streaming & Other */}
        <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Streaming y Otros</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Horario de Streams</label>
              <input className="input" value={streamSchedule} onChange={e => setStreamSchedule(e.target.value)} placeholder="Ej: Lun-Mie 20:00 UTC" />
            </div>
            <div className="form-group">
              <label className="form-label">Idiomas (separados por coma)</label>
              <input className="input" value={languagesInput} onChange={e => setLanguagesInput(e.target.value)} placeholder="Español, Inglés, Japonés" />
            </div>
            <div className="form-group">
              <label className="form-label">Hashtags (separados por coma)</label>
              <input className="input" value={hashtagsInput} onChange={e => setHashtagsInput(e.target.value)} placeholder="vtuber, español, gaming" />
            </div>
            <div className="form-group" style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
              <label className="form-label">Estado</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input type="checkbox" checked={isLive} onChange={e => setIsLive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                {isLive ? <span style={{ color: '#ff4444', fontWeight: 600 }}>🔴 En Directo</span> : <span style={{ color: 'var(--text-muted)' }}>⚫ Offline</span>}
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="submit" className="btn" disabled={saving} style={{ flex: '1', padding: '14px', fontSize: '1.1rem', minWidth: '200px' }}>
            {saving ? 'Guardando perfil VTuber...' : '💾 Guardar Perfil VTuber'}
          </button>

          {user.role !== 'VTUBER' && !user.vtuberProfile?.isApproved && (
            <button
              type="button"
              className="btn"
              style={{
                flex: '1',
                padding: '14px',
                fontSize: '1.1rem',
                minWidth: '200px',
                background: 'linear-gradient(135deg, #ff007f, #ff9800)',
              }}
              onClick={async () => {
                try {
                  await apiFetch('/vtubers/request', {
                    method: 'POST',
                    body: JSON.stringify({
                      displayName: displayName || user.username,
                      description: description || undefined,
                      avatarUrl: avatarUrl || undefined,
                      lore: lore || undefined,
                    }),
                  });
                  showToast('🎉 Solicitud enviada. Recibirás un código cuando sea aprobada.', 'success');
                } catch (err: unknown) {
                  showToast(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`, 'error');
                }
              }}
            >
              🎤 Solicitar ser VTuber Oficial
            </button>
          )}

          {user.vtuberProfile?.isApproved && user.role === 'VTUBER' && (
            <div
              className="glass"
              style={{
                flex: '1',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center',
                background: 'rgba(0,230,118,0.08)',
                border: '1px solid rgba(0,230,118,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#00e676',
                minWidth: '200px',
              }}
            >
              ✅ Eres un VTuber Oficial
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default function VtuberProfilePage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
      <VtuberProfileEditor />
    </ClientOnly>
  );
}
