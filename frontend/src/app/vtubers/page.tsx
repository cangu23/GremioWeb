'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ClientOnly from '@/lib/ClientOnly';
import SkeletonVTuberCard from '@/components/vtubers/SkeletonVTuberCard';
import VTuberIDCard, { VTuberProfile } from '@/components/vtubers/VTuberIDCard';
import VTuberLiveStage from '@/components/vtubers/VTuberLiveStage';
import VTuberStatsHeader from '@/components/vtubers/VTuberStatsHeader';
import VTuberFilterBar from '@/components/vtubers/VTuberFilterBar';
import { Star, Sparkles, Telescope, ChevronDown, ArrowLeft, ArrowRight } from '@/components/ui/Icons';

interface DirectoryMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function VtubersContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Overview Stats
  const [totalVtubers, setTotalVtubers] = useState(0);
  const [liveCount, setLiveCount] = useState(0);

  // Lists
  const [liveVtubers, setLiveVtubers] = useState<VTuberProfile[]>([]);
  const [featuredVtubers, setFeaturedVtubers] = useState<VTuberProfile[]>([]);
  const [directory, setDirectory] = useState<VTuberProfile[]>([]);
  const [meta, setMeta] = useState<DirectoryMeta | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('');
  const [onlyLive, setOnlyLive] = useState(false);
  const [page, setPage] = useState(1);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  // Discard stale directory responses (filter/page changes or keystrokes)
  const dirSeqRef = useRef(0);

  // Initial fetch overview data
  const fetchOverview = useCallback(async () => {
    try {
      const [liveData, featuredData, dirData] = await Promise.all([
        apiFetch('/vtubers/live', {}).catch(() => []),
        apiFetch('/vtubers/featured', {}).catch(() => []),
        apiFetch('/vtubers?limit=1&page=1', {}).catch(() => null),
      ]);

      const liveArr = Array.isArray(liveData) ? liveData : [];
      const featArr = Array.isArray(featuredData) ? featuredData : [];

      setLiveVtubers(liveArr);
      setLiveCount(liveArr.length);
      setFeaturedVtubers(featArr);
      setTotalVtubers(dirData?.meta?.total || 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Directory fetch with search/page/filters
  const fetchDirectory = useCallback(async (s: string, ct: string, liveOnly: boolean, p: number) => {
    const seq = ++dirSeqRef.current;
    setDirectoryLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (s) params.set('search', s);
      if (ct) params.set('contentType', ct);
      if (liveOnly) params.set('isLive', 'true');

      const data = await apiFetch(`/vtubers?${params}`, {});
      if (seq !== dirSeqRef.current) return; // a newer request superseded this one
      setDirectory(data.data || []);
      setMeta(data.meta || null);
    } catch {
      // keep existing data on fetch failure
    } finally {
      if (seq === dirSeqRef.current) setDirectoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Debounce keystrokes so typing in search doesn't fire a request per character;
  // the seq guard inside fetchDirectory also drops any response that arrives late.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDirectory(search, contentType, onlyLive, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, contentType, onlyLive, page, fetchDirectory]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, contentType, onlyLive]);

  // Auto-poll live streamers every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const liveData = await apiFetch('/vtubers/live', {});
        if (Array.isArray(liveData)) {
          setLiveVtubers(liveData);
          setLiveCount(liveData.length);
        }
      } catch {
        // silent
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '30px 0' }}>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '32px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass" style={{ padding: '20px', borderRadius: '16px', height: '86px' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonVTuberCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Sparkles size={48} color="var(--text-muted)" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>No pudimos cargar los VTubers</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.92rem' }}>Ocurrió un inconveniente al conectar con el servidor.</p>
        <button
          onClick={() => {
            setError(false);
            setLoading(true);
            fetchOverview();
          }}
          className="btn"
          style={{ padding: '12px 28px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontWeight: 700 }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 1. Header & Stats Widgets */}
      <VTuberStatsHeader totalVtubers={totalVtubers} liveCount={liveCount} featuredCount={featuredVtubers.length} />

      {/* 2. Stream iFrame Stage — ONLY RENDERS IF LIVE STREAMERS EXIST */}
      <VTuberLiveStage liveVtubers={liveVtubers} />

      {/* 3. Featured VTubers Section (If available & no search active) */}
      {featuredVtubers.length > 0 && !search && !contentType && !onlyLive && page === 1 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Star size={20} color="#f59e0b" fill="#f59e0b" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#fff' }}>VTubers Destacados</h2>
          </div>
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {featuredVtubers.map(vtuber => (
              <VTuberIDCard key={vtuber.id} vtuber={vtuber} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Directory & Filters Section */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#fff' }}>
            {search || contentType || onlyLive ? 'Resultados de Búsqueda' : 'Directorio de VTubers'}
          </h2>
        </div>

        {/* Search & Filter Bar Widget */}
        <VTuberFilterBar
          search={search}
          onSearchChange={setSearch}
          contentType={contentType}
          onCategoryChange={setContentType}
          onlyLive={onlyLive}
          onToggleOnlyLive={setOnlyLive}
          totalResults={meta?.total || directory.length}
        />

        {/* Directory Grid */}
        {directoryLoading ? (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonVTuberCard key={i} />
            ))}
          </div>
        ) : directory.length === 0 ? (
          <div
            className="glass"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              borderRadius: '20px',
              background: 'rgba(18, 18, 26, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <Telescope size={46} color="var(--text-muted)" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>
              {search || contentType || onlyLive ? 'No se encontraron VTubers' : 'Aún no hay VTubers en esta categoría'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', maxWidth: 420, margin: '0 auto 20px auto' }}>
              {search || contentType || onlyLive
                ? 'Prueba ajustando tus términos de búsqueda o removiendo los filtros activos.'
                : 'Sé el primero en solicitar tu perfil oficial de VTuber en el Gremio Estelar.'}
            </p>
            {(search || contentType || onlyLive) && (
              <button
                onClick={() => {
                  setSearch('');
                  setContentType('');
                  setOnlyLive(false);
                }}
                className="btn"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.88rem',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--primary-hover)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
              {directory.map(vtuber => (
                <VTuberIDCard key={vtuber.id} vtuber={vtuber} />
              ))}
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '36px',
                  paddingTop: '16px',
                }}
              >
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.85rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    opacity: page <= 1 ? 0.4 : 1,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                  }}
                >
                  <ArrowLeft size={15} />
                  Anterior
                </button>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 4px' }}>...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            border: p === page ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                            background: p === page ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                            color: '#fff',
                            fontWeight: p === page ? 800 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="btn"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.85rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    opacity: page >= meta.totalPages ? 0.4 : 1,
                    cursor: page >= meta.totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                  }}
                >
                  Siguiente
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Embedded Dynamic Keyframe Animations */}
      <style>{`
        @keyframes vtuber-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

export default function VtubersPage() {
  return (
    <div className="container" style={{ paddingBottom: '70px', paddingTop: '28px' }}>
      <ClientOnly
        fallback={
          <div style={{ padding: '30px 0' }}>
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonVTuberCard key={i} />
              ))}
            </div>
          </div>
        }
      >
        <VtubersContent />
      </ClientOnly>
    </div>
  );
}
