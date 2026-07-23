'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

// ==========================================================================
// Types
// ==========================================================================
export interface CustomSticker {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  type: 'emoji' | 'sticker';
}

// ==========================================================================
// Standard Emoji Shortcodes (Spanish + English)
// ==========================================================================
const STANDARD_EMOJIS: Record<string, string> = {
  hola: '👋', wave: '👋', saludo: '👋',
  corazon: '❤️', heart: '❤️', amor: '❤️',
  fuego: '🔥', fire: '🔥',
  estrella: '⭐', star: '⭐',
  sonrisa: '😊', smile: '😊',
  risas: '😂', lol: '😂', joy: '😂', rofl: '🤣',
  fiesta: '🎉', party: '🎉', tada: '🎉',
  brillos: '✨', sparkles: '✨',
  cohete: '🚀', rocket: '🚀',
  ok: '👍', like: '👍', thumbsup: '👍',
  aplauso: '👏', clap: '👏',
  gato: '🐱', cat: '🐱',
  perro: '🐶', dog: '🐶',
  pensativo: '🤔', thinking: '🤔',
  triste: '😢', sad: '😢',
  enojado: '😡', angry: '😡',
  ojos: '👀', eyes: '👀',
  destello: '✨', gremio: '✨',
  '100': '💯',
  maid: '🧹',
  vtuber: '🎤',
  gaming: '🎮',
  musica: '🎵', music: '🎵',
  arte: '🎨', art: '🎨',
  beso: '💋', kiss: '💋',
  monoculo: '🧐',
  robot: '🤖',
  alien: '👽',
  fantasma: '👻', ghost: '👻',
  calavera: '💀', skull: '💀',
  corona: '👑', crown: '👑',
  gema: '💎', gem: '💎',
  guiño: '😉', wink: '😉',
  fuerza: '💪', muscle: '💪',
  sol: '☀️', sun: '☀️',
  luna: '🌙', moon: '🌙',
  flor: '🌸', flower: '🌸',
  dulce: '🍬', candy: '🍬',
};

// ==========================================================================
// Custom Stickers Global Cache
// ==========================================================================
let globalStickersMap: Record<string, CustomSticker> | null = null;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function loadStickersCache(): Promise<void> {
  if (globalStickersMap) return Promise.resolve();
  if (fetchPromise) return fetchPromise;

  fetchPromise = apiFetch('/stickers', {})
    .then((data: any) => {
      const list = (Array.isArray(data) ? data : data?.data || data?.stickers || []) as CustomSticker[];
      const map: Record<string, CustomSticker> = {};
      list.forEach(s => {
        if (s.name) map[s.name.toLowerCase()] = s;
      });
      globalStickersMap = map;
      listeners.forEach(fn => fn());
    })
    .catch(() => {
      globalStickersMap = {};
    });

  return fetchPromise;
}

export function refreshStickersCache(): Promise<void> {
  globalStickersMap = null;
  fetchPromise = null;
  return loadStickersCache();
}

// Hook to ensure stickers cache is loaded in client components
export function useStickersCache() {
  const [stickersMap, setStickersMap] = useState<Record<string, CustomSticker> | null>(globalStickersMap);

  useEffect(() => {
    loadStickersCache().then(() => {
      setStickersMap(globalStickersMap);
    });
    const update = () => setStickersMap(globalStickersMap ? { ...globalStickersMap } : null);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  return stickersMap;
}

// ==========================================================================
// Main Content Renderer (Mentions, Hashtags, Emojis & Custom Stickers)
// ==========================================================================
export function renderFormattedContent(
  text: string,
  options?: {
    hashtagLink?: string;
    mentionLinkPrefix?: string;
  }
): React.ReactNode[] {
  if (!text) return [];

  // Ensure background cache fetch is initiated
  if (!globalStickersMap) {
    loadStickersCache();
  }

  // Split by hashtags (#tag), mentions (@user), and shortcodes (:name:)
  const parts = text.split(/(#[\wáéíóúÁÉÍÓÚñÑ]+|@[\w.]+|:[a-zA-Z0-9_.-]+:)/g);

  return parts.map((part, i) => {
    // 1. Hashtags (#tag)
    if (part.startsWith('#') && part.length > 1) {
      const tag = part.slice(1);
      return (
        <Link
          key={i}
          href={options?.hashtagLink ? `${options.hashtagLink}${tag}` : `/feed?tag=${tag}`}
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
        >
          {part}
        </Link>
      );
    }

    // 2. Mentions (@username)
    if (part.startsWith('@') && part.length > 1) {
      const username = part.slice(1);
      return (
        <Link
          key={i}
          href={options?.mentionLinkPrefix ? `${options.mentionLinkPrefix}${username}` : `/profile/${username}`}
          style={{ color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' }}
        >
          {part}
        </Link>
      );
    }

    // 3. Shortcodes (:name:)
    if (part.startsWith(':') && part.endsWith(':') && part.length > 2) {
      const code = part.slice(1, -1).toLowerCase();

      // a) Check standard emojis
      if (STANDARD_EMOJIS[code]) {
        return <span key={i} title={part} style={{ margin: '0 1px', fontSize: '1.1em' }}>{STANDARD_EMOJIS[code]}</span>;
      }

      // b) Check custom stickers/emojis from database cache
      if (globalStickersMap && globalStickersMap[code]) {
        const custom = globalStickersMap[code];
        const isEmoji = custom.type === 'emoji';
        return (
          <img
            key={i}
            src={custom.imageUrl}
            alt={part}
            title={`:${custom.name}:`}
            style={{
              width: isEmoji ? '1.5em' : '72px',
              height: isEmoji ? '1.5em' : '72px',
              verticalAlign: isEmoji ? '-0.25em' : 'middle',
              objectFit: 'contain',
              display: isEmoji ? 'inline-block' : 'inline-block',
              margin: isEmoji ? '0 2px' : '4px 6px',
            }}
          />
        );
      }

      // c) Shortcode badge fallback for unmapped custom shortcodes
      return (
        <span
          key={i}
          title={part}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 6px',
            borderRadius: '6px',
            background: 'rgba(138,43,226,0.12)',
            border: '1px solid rgba(138,43,226,0.2)',
            color: 'var(--primary)',
            fontSize: '0.85em',
            fontWeight: 600,
            margin: '0 2px',
          }}
        >
          {part}
        </span>
      );
    }

    // Regular text
    return part;
  });
}

// React component wrapper to ensure reactive re-renders when stickers load
export function FormattedText({
  text,
  options,
}: {
  text: string;
  options?: { hashtagLink?: string; mentionLinkPrefix?: string };
}) {
  useStickersCache();
  return <>{renderFormattedContent(text, options)}</>;
}
