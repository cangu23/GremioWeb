'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import { useToast } from '@/lib/ToastContext';
import RecentActivity from '@/components/landing/RecentActivity';

interface GamificationData {
  xp: number;
  level: number;
  xpProgress: { current: number; level: number };
  achievements: Array<{ id: string; name: string; description: string }>;
}

function DashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [gami, setGami] = useState<GamificationData | null>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ message: string; newRole: string; codeName: string } | null>(null);

  const xpThresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000, 12000];

  useEffect(() => {
    if (user) {
      apiFetch('/gamification/me', {}).then(setGami).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      setUsername(user.username);
      setDescription(user.vtuberProfile?.description || '');
      setAvatarUrl(user.vtuberProfile?.avatarUrl || '');
      setDisplayName(user.vtuberProfile?.displayName || '');
    }
  }, [user, isLoading, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          username,
          description,
          avatarUrl: avatarUrl || undefined,
          ...(displayName !== (user?.vtuberProfile?.displayName || '') ? { displayName } : {}),
        }),
      });
      setMessage('Perfil actualizado con éxito.');
      showToast('Perfil actualizado ✅', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setMessage(`Error: ${msg}`);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getXpProgress = (xp: number, level: number) => {
    const prevThresh = xpThresholds[Math.min(level - 1, xpThresholds.length - 1)];
    const nextThresh = xpThresholds[Math.min(level, xpThresholds.length - 1)];
    const progress = xp - prevThresh;
    const needed = nextThresh - prevThresh;
    return { current: progress, needed, percentage: needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 100 };
  };

  if (isLoading || !user) {
    return (
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          color: 'var(--text-muted)',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <span
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const xpProgress = gami ? getXpProgress(gami.xp, gami.level) : null;

  return (
    <div
      style={{
        animation: 'fadeIn 0.5s ease',
      }}
    >
      {/* Hero header */}
      <div
        style={{
          position: 'relative',
          marginBottom: '40px',
          padding: '40px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(255,0,127,0.05))',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(138,43,226,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                color: 'white',
                fontWeight: 'bold',
                border: '3px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            >
              {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  marginBottom: '4px',
                }}
              >
                Bienvenido,{' '}
                <span className="gradient-text">{user.username}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {displayName
                  ? `${displayName} — Panel de control`
                  : 'Panel de control'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {[
          { icon: '', label: 'Eventos', href: '/events', desc: 'Ver y crear eventos' },
          { icon: '', label: 'Gremios', href: '/guilds', desc: 'Unete a un gremio' },
          { icon: '', label: 'Chat', href: '/chat', desc: 'Chatea en vivo' },
          { icon: '', label: 'Logros', href: '/achievements', desc: 'Tus logros' },
          { icon: '', label: 'Feed', href: '/feed', desc: 'Publicaciones' },
          { icon: '', label: 'VTubers', href: '/vtubers', desc: 'Explora perfiles' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="glass"
            style={{
              padding: '24px 20px',
              borderRadius: '16px',
              textDecoration: 'none',
              color: 'var(--text)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px',
              border: '1px solid var(--glass-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>--</span>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.label}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</span>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: '40px' }}>
        <RecentActivity />
      </div>

      {/* Main content grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
        }}
      >
        {/* XP Card */}
        {gami && xpProgress && (
          <div
            className="glass"
            style={{
              padding: '32px',
              borderRadius: '20px',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Nivel
                </p>
                <p
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    background:
                      'linear-gradient(135deg, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {gami.level}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Experiencia
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {gami.xp.toLocaleString()}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    XP
                  </span>
                </p>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Nv. {gami.level}</span>
                <span>
                  {xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()} XP
                </span>
                <span>Nv. {gami.level + 1}</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '14px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '7px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${xpProgress.percentage}%`,
                    height: '100%',
                    background:
                      'linear-gradient(90deg, var(--primary), var(--secondary), var(--accent))',
                    borderRadius: '7px',
                    transition: 'width 1s ease',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.65rem',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {xpProgress.percentage}%
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/achievements"
                className="btn"
                style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}
              >
                Logros ({gami.achievements.length})
              </Link>
              <Link
                href="/leaderboard"
                className="btn btn-outline"
                style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}
              >
                Ranking
              </Link>
            </div>
          </div>
        )}

        {/* 🔐 Redeem Code Card */}
        <div
          className="glass"
          style={{
            padding: '32px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <h2
            style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Canjear Código
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            ¿Tienes un código de invitación? Canjéalo aquí para obtener un rol especial.
          </p>

          {redeemResult ? (
            <div
              className="glass"
              style={{
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                background: 'rgba(0,230,118,0.08)',
                border: '1px solid rgba(0,230,118,0.2)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 700, color: 'var(--success)' }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px', color: '#00e676' }}>{redeemResult.message}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Código: {redeemResult.codeName}
              </div>
              <button
                onClick={() => { setRedeemResult(null); setShowRedeem(false); window.location.reload(); }}
                className="btn"
                style={{ marginTop: '16px', padding: '10px 24px' }}
              >
                Continuar
              </button>
            </div>
          ) : showRedeem ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!redeemCode.trim()) return;
                setRedeeming(true);
                try {
                  const res = await apiFetch('/auth/redeem-code', {
                    method: 'POST',
                    body: JSON.stringify({ code: redeemCode.trim() }),
                  });
                  setRedeemResult(res);
                  showToast(`${res.message}`, 'success');
                } catch (err: unknown) {
                  showToast(err instanceof Error ? err.message : 'Código inválido', 'error');
                } finally {
                  setRedeeming(false);
                }
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  className="input"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Ej: GC-7F3K9A2B..."
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem' }}
                  required
                />
                <button
                  type="submit"
                  className="btn"
                  disabled={redeeming || !redeemCode.trim()}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  }}
                >
                  {redeeming ? '...' : 'Canjear'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowRedeem(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginTop: '8px',
                  padding: '4px 8px',
                }}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowRedeem(true)}
              className="btn"
              style={{
                width: '100%',
                padding: '14px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ff007f, #8a2be2)',
              }}
            >
              Tengo un Codigo
            </button>
          )}
        </div>

        {/* Edit Profile Card */}
        <div
          className="glass"
          style={{
            padding: '32px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <h2
            style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Editar Perfil
          </h2>

          {message && (
            <div
              style={{
                background: message.startsWith('Error')
                  ? 'rgba(255,77,79,0.1)'
                  : 'rgba(0,230,118,0.1)',
                border: `1px solid ${
                  message.startsWith('Error') ? 'rgba(255,77,79,0.2)' : 'rgba(0,230,118,0.2)'
                }`,
                color: message.startsWith('Error') ? 'var(--error)' : 'var(--success)',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <span style={{ fontWeight: 700 }}>{message.startsWith('Error') ? '!' : '✓'}</span>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            {/* Avatar preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: avatarUrl
                    ? `url(${avatarUrl}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  color: 'white',
                  fontWeight: 'bold',
                  border: '3px solid rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}
              >
                {!avatarUrl && (displayName || user.username).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">URL del Avatar</label>
                <input
                  className="input"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.png"
                  style={{ fontSize: '0.85rem' }}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  Usa una URL de imagen (Imgur, Discord, etc.)
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="form-group">
                <label className="form-label">Nombre de usuario</label>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre VTuber</label>
                <input
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej: Sakura Chan"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Descripción</label>
              <textarea
                className="input"
                style={{
                  minHeight: '120px',
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntale a la comunidad sobre ti..."
              />
            </div>

            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 700,
                background:
                  'linear-gradient(135deg, var(--primary), var(--secondary))',
              }}
              disabled={saving}
            >
              {saving ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Guardando...
                </span>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px' }}>
      <ClientOnly
        fallback={
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
              color: 'var(--text-muted)',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p>Cargando dashboard...</p>
          </div>
        }
      >
        <DashboardContent />
      </ClientOnly>
    </div>
  );
}
