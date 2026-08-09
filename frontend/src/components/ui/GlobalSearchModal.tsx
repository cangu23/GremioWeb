'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface SearchResult {
  users: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    vtuberProfile?: { displayName: string; avatarUrl: string | null; isVerified?: boolean } | null;
  }>;
  guilds: Array<{
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    _count: { members: number };
  }>;
  posts: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
  }>;
  events: Array<{
    id: string;
    title: string;
    date: string;
    creator: { id: string; username: string };
  }>;
}

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ users: [], guilds: [], posts: [], events: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  // Discard stale responses: only the latest query may write results
  const searchSeqRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ users: [], guilds: [], posts: [], events: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      searchSeqRef.current++; // invalidate any in-flight search
      setResults({ users: [], guilds: [], posts: [], events: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const seq = ++searchSeqRef.current;
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(`/search?q=${encodeURIComponent(query.trim())}&limit=4`, {});
        if (seq !== searchSeqRef.current) return; // a newer query superseded this one
        setResults(data);
      } catch {
        if (seq !== searchSeqRef.current) return;
        setResults({ users: [], guilds: [], posts: [], events: [] });
      } finally {
        if (seq === searchSeqRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.users.length + results.guilds.length + results.posts.length + results.events.length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          background: 'rgba(15, 15, 22, 0.95)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out',
        }}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar usuarios, gremios, eventos o publicaciones..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '1rem',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px' }} />
              Buscando en la galaxia...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Escribe algo para buscar en GremioWeb
            </div>
          )}

          {/* Users */}
          {!loading && results.users.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
                Usuarios ({results.users.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.users.map(u => {
                  const name = u.displayName || u.vtuberProfile?.displayName || u.username;
                  const avatar = u.avatarUrl || u.vtuberProfile?.avatarUrl;
                  return (
                    <Link
                      key={u.id}
                      href={`/profile/${u.id}`}
                      onClick={onClose}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px',
                        textDecoration: 'none', color: 'inherit', transition: 'background 0.15s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: avatar ? `url(${avatar}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem',
                      }}>
                        {!avatar && name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guilds */}
          {!loading && results.guilds.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
                Gremios ({results.guilds.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.guilds.map(g => (
                  <Link
                    key={g.id}
                    href={`/guilds/${g.id}`}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px',
                      textDecoration: 'none', color: 'inherit', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: g.logoUrl ? `url(${g.logoUrl}) center/cover` : 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem',
                    }}>
                      {!g.logoUrl && g.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{g.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g._count.members} miembros</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {!loading && results.events.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
                Eventos ({results.events.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.events.map(ev => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px',
                      textDecoration: 'none', color: 'inherit', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ev.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        por @{ev.creator.username} · {new Date(ev.date).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {!loading && results.posts.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#4caf50', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
                Publicaciones ({results.posts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.posts.map(p => (
                  <Link
                    key={p.id}
                    href={`/feed?post=${p.id}`}
                    onClick={onClose}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', borderRadius: '8px',
                      textDecoration: 'none', color: 'inherit', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      @{p.user.username}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.content}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
