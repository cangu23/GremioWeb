'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface SocialUser {
  id: string;
  username: string;
  vtuberProfile?: { displayName: string; avatarUrl: string | null } | null;
}

interface SocialProfile {
  id: string;
  username: string;
  role: string;
  vtuberProfile?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    description: string | null;
  } | null;
  _count: { followers: number; following: number };
  isFollowedByMe: boolean;
}

function ProfileContent() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState(5);
  const [donateMessage, setDonateMessage] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState('');
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch(`/social/profile/${id}`);
      setProfile(data);
      setIsFollowed(data.isFollowedByMe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFollow = async () => {
    if (!currentUser) { router.push('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowed) {
        await apiFetch(`/social/unfollow/${id}`, { method: 'POST' });
        setIsFollowed(false);
        setProfile(prev => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers - 1 } } : prev);
      } else {
        await apiFetch(`/social/follow/${id}`, { method: 'POST' });
        setIsFollowed(true);
        setProfile(prev => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers + 1 } } : prev);
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setFollowLoading(false); }
  };

  const handleDonate = async () => {
    if (!currentUser) { router.push('/login'); return; }
    setDonateLoading(true);
    try {
      await apiFetch('/payments/donate', {
        method: 'POST',
        body: JSON.stringify({ recipientId: String(id), amount: donateAmount, message: donateMessage || undefined }),
      });
      setDonateSuccess(`¡Donaste $${donateAmount} USD a ${profile?.username}! 💝`);
      setShowDonate(false);
      setTimeout(() => setDonateSuccess(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setDonateLoading(false); }
  };

  const loadFollowers = async () => {
    setShowFollowers(true);
    try { const data = await apiFetch(`/social/followers/${id}`); setFollowers(data); } catch {}
  };
  const loadFollowing = async () => {
    setShowFollowing(true);
    try { const data = await apiFetch(`/social/following/${id}`); setFollowing(data); } catch {}
  };

  if (error) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><p style={{ color: 'var(--error)' }}>Error: {error}</p></div>;
  if (!profile) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Cargando perfil...</p></div>;

  const isOwnProfile = currentUser?.id === profile.id;
  const avatarUrl = profile.vtuberProfile?.avatarUrl;

  return (
    <>
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="glass" style={{ padding: '50px 30px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          {/* Avatar */}
          <div style={{
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', color: 'white', fontWeight: 'bold',
            border: '3px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            {!avatarUrl && (profile.vtuberProfile?.displayName || profile.username).charAt(0).toUpperCase()}
          </div>

          <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>
            {profile.vtuberProfile?.displayName || profile.username}
          </h1>
          <p style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.1rem' }}>
            @{profile.username}
          </p>

          {profile.vtuberProfile?.description ? (
            <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '25px' }}>
              {profile.vtuberProfile.description}
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>
              Este VTuber aún no ha escrito una descripción.
            </p>
          )}

          {/* Social counts */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <button onClick={loadFollowers} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'center', padding: '8px 16px', borderRadius: '8px', transition: 'background 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{profile._count.followers}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Seguidores</div>
            </button>
            <button onClick={loadFollowing} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'center', padding: '8px 16px', borderRadius: '8px', transition: 'background 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{profile._count.following}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Siguiendo</div>
            </button>
          </div>

          {/* Donate success message */}
          {donateSuccess && (
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: 'rgba(0,230,118,0.1)', color: 'var(--success)', fontSize: '0.9rem' }}>
              {donateSuccess}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isOwnProfile ? (
              <>
                <button onClick={handleFollow} disabled={followLoading} className="btn"
                  style={{ padding: '12px 32px', fontSize: '1rem', background: isFollowed ? 'rgba(255,255,255,0.1)' : undefined, border: isFollowed ? '1px solid var(--glass-border)' : undefined, color: isFollowed ? 'var(--text)' : undefined }}>
                  {followLoading ? '...' : isFollowed ? 'Dejar de seguir' : 'Seguir'}
                </button>
                <button onClick={() => setShowDonate(true)} className="btn"
                  style={{ padding: '12px 32px', fontSize: '1rem', background: 'transparent', border: '1px solid #ffd700', color: '#ffd700' }}>
                  💝 Donar
                </button>
              </>
            ) : (
              <Link href="/dashboard" className="btn" style={{ padding: '12px 32px', fontSize: '1rem', display: 'inline-block' }}>
                Editar Perfil
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      {showDonate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setShowDonate(false)}>
          <div className="glass" style={{ padding: '30px', width: '90%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>💝 Donar a {profile.username}</h3>
            <div className="form-group">
              <label className="form-label">Monto (USD)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[1, 3, 5, 10, 20].map(a => (
                  <button key={a} onClick={() => setDonateAmount(a)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: donateAmount === a ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: donateAmount === a ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
                    ${a}
                  </button>
                ))}
              </div>
              <input type="number" className="input" value={donateAmount} onChange={e => setDonateAmount(Math.max(1, Number(e.target.value)))} min={1} max={1000} style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Mensaje (opcional)</label>
              <textarea className="input" value={donateMessage} onChange={e => setDonateMessage(e.target.value)} placeholder="¡Sigue así! 💪" style={{ minHeight: '80px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowDonate(false)} className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)' }}>Cancelar</button>
              <button onClick={handleDonate} className="btn" style={{ flex: 1 }} disabled={donateLoading}>
                {donateLoading ? 'Procesando...' : `Donar $${donateAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setShowFollowers(false)}>
          <div className="glass" style={{ padding: '30px', width: '90%', maxWidth: '400px', maxHeight: '60vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Seguidores</h3>
            {followers.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Sin seguidores aún.</p> : followers.map(f => (
              <Link key={f.id} href={`/profile/${f.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', color: 'var(--text)', textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setShowFollowers(false)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: f.vtuberProfile?.avatarUrl ? `url(${f.vtuberProfile.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', overflow: 'hidden' }}>
                  {!f.vtuberProfile?.avatarUrl && (f.vtuberProfile?.displayName || f.username).charAt(0).toUpperCase()}
                </div>
                <div><div style={{ fontWeight: 600 }}>{f.vtuberProfile?.displayName || f.username}</div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{f.username}</div></div>
              </Link>
            ))}
            <button onClick={() => setShowFollowers(false)} className="btn" style={{ width: '100%', marginTop: '15px', padding: '10px' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setShowFollowing(false)}>
          <div className="glass" style={{ padding: '30px', width: '90%', maxWidth: '400px', maxHeight: '60vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Siguiendo</h3>
            {following.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No sigue a nadie aún.</p> : following.map(f => (
              <Link key={f.id} href={`/profile/${f.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', color: 'var(--text)', textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setShowFollowing(false)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: f.vtuberProfile?.avatarUrl ? `url(${f.vtuberProfile.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', overflow: 'hidden' }}>
                  {!f.vtuberProfile?.avatarUrl && (f.vtuberProfile?.displayName || f.username).charAt(0).toUpperCase()}
                </div>
                <div><div style={{ fontWeight: 600 }}>{f.vtuberProfile?.displayName || f.username}</div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{f.username}</div></div>
              </Link>
            ))}
            <button onClick={() => setShowFollowing(false)} className="btn" style={{ width: '100%', marginTop: '15px', padding: '10px' }}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProfilePage() {
  return (
    <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando perfil...</div>}>
      <ProfileContent />
    </ClientOnly>
  );
}
