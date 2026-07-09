'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';

interface VTuberCard {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

function VtubersContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VTuberCard[]>([]);
  const [recentUsers, setRecentUsers] = useState<VTuberCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // Load some recent users on mount
    if (query.length === 0 && !searched) {
      setLoading(true);
      apiFetch('/users/search?q=a', {}).then(setRecentUsers).catch(() => {}).finally(() => setLoading(false));
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 2) return;
    setSearched(true);
    setLoading(true);
    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`, {});
      setResults(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const displayUsers = searched ? results : recentUsers;

  return (
    <>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '2.5rem' }}>🔍 Directorio de VTubers</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
          Encuentra y conecta con otros VTubers de la comunidad
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '500px' }}>
          <input
            className="input"
            style={{ flex: 1, padding: '12px 16px', fontSize: '1rem' }}
            placeholder="Buscar por nombre de usuario..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn" style={{ padding: '12px 24px' }} disabled={query.length < 2}>
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          Buscando...
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          {searched ? 'No se encontraron usuarios con ese nombre.' : 'No hay VTubers registrados aún.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {displayUsers.map(v => (
            <Link key={v.id} href={`/profile/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass" style={{
                padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 0.2s ease', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(138,43,226,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: v.avatarUrl ? `url(${v.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', color: 'white', fontWeight: 'bold',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {!v.avatarUrl && (v.displayName || v.username).charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.displayName || v.username}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>@{v.username}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: '0.85rem' }}>
                  Ver perfil →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function VtubersPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px' }}>
      <ClientOnly fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
        <VtubersContent />
      </ClientOnly>
    </div>
  );
}
