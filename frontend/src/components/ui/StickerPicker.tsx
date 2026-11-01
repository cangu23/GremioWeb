'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ==========================================================================
// Types
// ==========================================================================
export interface StickerData {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  type: 'emoji' | 'sticker';
  minPlan?: string;
  isNativeEmoji?: boolean;
}

interface StickerPickerProps {
  /** Called when a sticker or emoji is selected */
  onSelect: (sticker: StickerData) => void;
  /** Optional: close handler */
  onClose?: () => void;
  /** Optional: filter by type */
  filterType?: 'emoji' | 'sticker' | 'all';
}

// ==========================================================================
// Category icon mapping for custom stickers
// ==========================================================================
const CATEGORY_ICONS: Record<string, string> = {
  general: '📌',
  anime: '🎌',
  meme: '😂',
  hearts: '❤️',
  reaction: '🔥',
  reactions: '🔥',
  celebration: '🎉',
  gremio: '✨',
  kawaii: '🌸',
  funny: '🤣',
  gaming: '🎮',
  love: '💖',
  sad: '😢',
  angry: '💢',
};

// ==========================================================================
// Standard Native Unicode Emojis Grouped
// ==========================================================================
const NATIVE_EMOJI_GROUPS: Record<string, { label: string; icon: string; emojis: string[] }> = {
  faces: {
    label: 'Caritas',
    icon: '😊',
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹','😊','😇','🙂','😉','😌',
      '😍','🥰','😘','😋','😛','😜','🤪','😎','🤩','🥳','😏','😒','😞','😔','🥺',
      '😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','🤔','🤫','🫠','😴',
    ],
  },
  hearts: {
    label: 'Amor',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞',
      '💓','💗','💖','💘','💝','💟','💌','💋','🫂',
    ],
  },
  gestures: {
    label: 'Gestos',
    icon: '👍',
    emojis: [
      '👍','👎','👊','✊','👏','🙌','🤲','🤝','🙏','💪','👋','👌','🤌','✌️','🤞',
      '🫰','🤟','🤘','🤙','👈','👉','👆','👇','👀','💯',
    ],
  },
  anime_fun: {
    label: 'Anime & Ocio',
    icon: '🎌',
    emojis: [
      '🌸','✨','⭐','🌟','💫','⚡','🔥','💥','🎉','🎊','🎮','🕹️','🎲','🎯','🎨',
      '🎤','🎧','🎵','🎶','🧹','👑','💎','🍙','🍣','🍜','🍡','🧋','🐱','🦊','🐰',
      '🦄','👻','💀','👽','🤖',
    ],
  },
};

// In-memory cache for public stickers so reopening the picker is instant
let cachedStickers: StickerData[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export default function StickerPicker({ onSelect, onClose, filterType = 'all' }: StickerPickerProps) {
  // Main Tab: 'stickers' | 'emojis' | 'recent'
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis' | 'recent'>('stickers');

  // Custom stickers data
  const [stickers, setStickers] = useState<StickerData[]>(cachedStickers || []);
  const [loading, setLoading] = useState(!cachedStickers);
  const [search, setSearch] = useState('');

  // Sub-categories
  const [stickerCategory, setStickerCategory] = useState<string>('all');
  const [emojiGroup, setEmojiGroup] = useState<string>('faces');

  // Recently used items
  const [recentItems, setRecentItems] = useState<StickerData[]>([]);

  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recently used from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gremio_recent_stickers');
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  // Fetch stickers with caching
  useEffect(() => {
    let cancelled = false;
    const now = Date.now();

    if (cachedStickers && now - lastCacheTime < CACHE_TTL_MS) {
      setStickers(cachedStickers);
      setLoading(false);
      return;
    }

    const fetchStickers = async () => {
      try {
        const data = await apiFetch('/stickers', {});
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : data?.data || data?.stickers || []) as StickerData[];
        cachedStickers = list;
        lastCacheTime = Date.now();
        setStickers(list);
      } catch {
        // fail gracefully
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStickers();
    return () => { cancelled = true; };
  }, []);

  // Focus search input on open
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!onClose) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
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

  // Save selected item to recents
  const saveToRecents = useCallback((item: StickerData) => {
    try {
      setRecentItems(prev => {
        const filtered = prev.filter(r => r.name !== item.name);
        const updated = [item, ...filtered].slice(0, 24);
        localStorage.setItem('gremio_recent_stickers', JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore storage quota
    }
  }, []);

  const handleSelectSticker = (item: StickerData) => {
    saveToRecents(item);
    onSelect(item);
    onClose?.();
  };

  const handleSelectNativeEmoji = (emoji: string) => {
    const item: StickerData = {
      id: `native-${emoji}`,
      name: emoji,
      imageUrl: '',
      category: 'native',
      type: 'emoji',
      isNativeEmoji: true,
    };
    saveToRecents(item);
    onSelect(item);
    onClose?.();
  };

  // Unique categories for custom stickers
  const stickerCategories = useMemo(() => {
    const cats = Array.from(new Set(stickers.map(s => s.category)));
    return ['all', ...cats];
  }, [stickers]);

  // Filtered custom stickers
  const filteredStickers = useMemo(() => {
    return stickers.filter(s => {
      if (filterType !== 'all' && s.type !== filterType) return false;
      if (stickerCategory !== 'all' && s.category !== stickerCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stickers, filterType, stickerCategory, search]);

  // Filtered native emojis if searching
  const filteredNativeEmojis = useMemo(() => {
    if (!search.trim()) {
      return NATIVE_EMOJI_GROUPS[emojiGroup]?.emojis || [];
    }
    // Search across all native emoji groups
    const q = search.toLowerCase().trim();
    const allEmojis: string[] = [];
    Object.values(NATIVE_EMOJI_GROUPS).forEach(group => {
      allEmojis.push(...group.emojis);
    });
    // Return all if query, or unique list
    return Array.from(new Set(allEmojis));
  }, [emojiGroup, search]);

  return (
    <div
      ref={pickerRef}
      style={{
        width: '340px',
        maxWidth: '92vw',
        maxHeight: '430px',
        background: 'rgba(18, 16, 28, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(138,43,226,0.3)',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(138,43,226,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        userSelect: 'none',
      }}
    >
      {/* ── Header: Search bar ── */}
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
          padding: '6px 10px', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🔍</span>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'emojis' ? 'Buscar emojis...' : 'Buscar stickers (:pepe_dance:)...'}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              fontSize: '0.84rem', outline: 'none', width: '100%',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.75rem', padding: '0 2px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs: Stickers / Emojis / Recientes ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)', padding: '4px 8px', gap: '4px',
      }}>
        <button
          onClick={() => setActiveTab('stickers')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: '8px', border: 'none',
            background: activeTab === 'stickers' ? 'rgba(138,43,226,0.25)' : 'transparent',
            color: activeTab === 'stickers' ? '#c084fc' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
        >
          <span>🏷️</span> Stickers ({stickers.length})
        </button>

        <button
          onClick={() => setActiveTab('emojis')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: '8px', border: 'none',
            background: activeTab === 'emojis' ? 'rgba(0,212,255,0.2)' : 'transparent',
            color: activeTab === 'emojis' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
        >
          <span>😊</span> Emojis
        </button>

        {recentItems.length > 0 && (
          <button
            onClick={() => setActiveTab('recent')}
            style={{
              padding: '6px 10px', borderRadius: '8px', border: 'none',
              background: activeTab === 'recent' ? 'rgba(234,179,8,0.2)' : 'transparent',
              color: activeTab === 'recent' ? '#facc15' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
            }}
          >
            <span>⭐</span> Recientes
          </button>
        )}
      </div>

      {/* ── Sub-category pill bar ── */}
      {activeTab === 'stickers' && stickerCategories.length > 1 && !search && (
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'none',
        }}>
          {stickerCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setStickerCategory(cat)}
              style={{
                padding: '3px 10px', borderRadius: '12px', border: 'none',
                background: stickerCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: stickerCategory === cat ? '#fff' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}{cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'emojis' && !search && (
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'none',
        }}>
          {Object.entries(NATIVE_EMOJI_GROUPS).map(([key, group]) => (
            <button
              key={key}
              onClick={() => setEmojiGroup(key)}
              style={{
                padding: '3px 10px', borderRadius: '12px', border: 'none',
                background: emojiGroup === key ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.05)',
                color: emojiGroup === key ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {group.icon} {group.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content Grid View ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        maxHeight: '290px',
      }}>
        {/* Recents tab */}
        {activeTab === 'recent' && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
              Usados recientemente ({recentItems.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {recentItems.map((item, idx) => {
                if (item.isNativeEmoji || !item.imageUrl) {
                  return (
                    <button
                      key={`rec-${item.name}-${idx}`}
                      onClick={() => handleSelectNativeEmoji(item.name)}
                      title={item.name}
                      style={{
                        padding: '6px', borderRadius: '8px', border: 'none',
                        background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                        fontSize: '1.4rem', lineHeight: 1, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.1s, background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      {item.name}
                    </button>
                  );
                }

                return (
                  <button
                    key={`rec-${item.id}-${idx}`}
                    onClick={() => handleSelectSticker(item)}
                    title={`:${item.name}:`}
                    style={{
                      padding: '4px', borderRadius: '8px', border: 'none',
                      background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.1s, background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Native Emojis Tab */}
        {activeTab === 'emojis' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {filteredNativeEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => handleSelectNativeEmoji(emoji)}
                title={emoji}
                style={{
                  padding: '7px 4px', borderRadius: '8px', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: '1.45rem', lineHeight: 1, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.1s, background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Custom Stickers Tab */}
        {activeTab === 'stickers' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Cargando stickers...
              </div>
            ) : filteredStickers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No se encontraron stickers
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}>
                {filteredStickers.map(sticker => {
                  const isEmoji = sticker.type === 'emoji';
                  const isVip = sticker.minPlan && sticker.minPlan !== 'FREE';

                  return (
                    <button
                      key={sticker.id}
                      onClick={() => handleSelectSticker(sticker)}
                      title={`:${sticker.name}: ${isVip ? `(${sticker.minPlan})` : ''}`}
                      style={{
                        padding: '6px', borderRadius: '10px',
                        border: isVip ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '4px',
                        position: 'relative',
                        transition: 'transform 0.12s, background 0.12s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.12)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      {isVip && (
                        <span style={{
                          position: 'absolute', top: '2px', right: '3px',
                          fontSize: '0.55rem', fontWeight: 800, color: '#facc15',
                        }}>
                          ⭐
                        </span>
                      )}
                      <img
                        src={sticker.imageUrl}
                        alt={sticker.name}
                        loading="lazy"
                        style={{
                          width: isEmoji ? '32px' : '52px',
                          height: isEmoji ? '32px' : '52px',
                          objectFit: 'contain',
                        }}
                      />
                      <span style={{
                        fontSize: '0.65rem', color: 'var(--text-muted)',
                        maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        :{sticker.name}:
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.68rem', color: 'var(--text-muted)',
      }}>
        <span>Gremio Estelar Emojis</span>
        <span>Esc para cerrar</span>
      </div>
    </div>
  );
}
