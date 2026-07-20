'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ==========================================================================
// Types
// ==========================================================================
interface StickerData {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  type: 'emoji' | 'sticker';
}

interface StickerPickerProps {
  /** Called when a sticker is selected */
  onSelect: (sticker: StickerData) => void;
  /** Optional: close handler (e.g. to close parent modal) */
  onClose?: () => void;
  /** Optional: filter by type (emoji, sticker, or both) */
  filterType?: 'emoji' | 'sticker' | 'all';
}

// ==========================================================================
// SVG Icons
// ==========================================================================
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const StickerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const EmojiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

// ==========================================================================
// Category icon mapping
// ==========================================================================
const CATEGORY_ICONS: Record<string, string> = {
  general: '📌',
  anime: '🎌',
  meme: '😂',
  hearts: '❤️',
  reactions: '🔥',
  celebration: '🎉',
  gremio: '✨',
  kawaii: '🌸',
  funny: '🤣',
};

// ==========================================================================
// StickerPicker Component
// ==========================================================================
export default function StickerPicker({ onSelect, onClose, filterType = 'all' }: StickerPickerProps) {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch stickers from public API
  useEffect(() => {
    let cancelled = false;
    const fetchStickers = async () => {
      try {
        const data = await apiFetch('/stickers', {});
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : data?.data || data?.stickers || []) as StickerData[];
        setStickers(list);

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(list.map(s => s.category)));
        const cats = ['all', ...uniqueCategories] as string[];
        setCategories(cats);
        if (cats.length > 1) setActiveCategory(cats[0]);
      } catch {
        // Silently fail — picker just won't show anything
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStickers();
    return () => { cancelled = true; };
  }, []);

  // Focus search input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!onClose) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!onClose) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Filter stickers based on search, category, and type
  const filteredStickers = stickers.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSelect = (sticker: StickerData) => {
    onSelect(sticker);
    onClose?.();
  };

  return (
    <div
      ref={pickerRef}
      style={{
        width: '340px',
        maxHeight: '380px',
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '14px',
        boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInUp 0.15s ease-out',
      }}
    >
      {/* ── Search bar ── */}
      <div style={{ padding: '10px 12px 6px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '8px 10px',
          border: '1px solid rgba(255,255,255,0.06)',
          transition: 'border-color 0.15s',
        }}>
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar stickers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'none',
              color: 'var(--text)', fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '2px', fontSize: '0.9rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category tabs ── */}
      {categories.length > 1 && !search && (
        <div style={{
          display: 'flex', gap: '4px', padding: '8px 12px',
          overflowX: 'auto', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          scrollbarWidth: 'thin',
        }}>
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            const icon = cat === 'all' ? '🔮' : CATEGORY_ICONS[cat] || '📁';
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 10px', borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Sticker grid ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 12px',
        scrollbarWidth: 'thin',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(255,255,255,0.08)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : filteredStickers.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '30px 10px',
            color: 'var(--text-muted)', fontSize: '0.85rem',
          }}>
            {search ? (
              <>
                <p style={{ margin: '0 0 6px', fontSize: '1.5rem' }}>🔍</p>
                <p style={{ margin: 0 }}>No se encontraron stickers para "{search}"</p>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 6px', fontSize: '1.5rem' }}>📦</p>
                <p style={{ margin: 0 }}>No hay stickers disponibles</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.6 }}>
                  El staff puede agregarlos desde el panel de administración
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px',
            justifyContent: 'flex-start',
          }}>
            {filteredStickers.map(sticker => {
              const isEmoji = sticker.type === 'emoji';
              const size = isEmoji ? '32px' : '80px';
              return (
                <button
                  key={sticker.id}
                  onClick={() => handleSelect(sticker)}
                  title={sticker.name}
                  style={{
                    width: isEmoji ? '38px' : '88px',
                    height: isEmoji ? '38px' : '88px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '10px',
                    border: '1px solid transparent',
                    background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'all 0.12s',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(138,43,226,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(138,43,226,0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.name}
                    style={{
                      width: size,
                      height: size,
                      objectFit: 'contain',
                      borderRadius: isEmoji ? '4px' : '6px',
                      pointerEvents: 'none',
                    }}
                    loading="lazy"
                    onError={e => {
                      // Fallback: show name initial on error
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      (target.parentElement as HTMLElement).innerText = sticker.name.charAt(0).toUpperCase();
                      (target.parentElement as HTMLElement).style.fontSize = isEmoji ? '1rem' : '1.5rem';
                      (target.parentElement as HTMLElement).style.fontWeight = 'bold';
                      (target.parentElement as HTMLElement).style.color = 'var(--text-muted)';
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer hint ── */}
      {filteredStickers.length > 0 && (
        <div style={{
          padding: '6px 12px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {filteredStickers.length} sticker{filteredStickers.length !== 1 ? 's' : ''} · Esc para cerrar
        </div>
      )}
    </div>
  );
}
