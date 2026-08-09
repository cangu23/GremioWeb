'use client';

import React from 'react';
import { Search, X } from '@/components/ui/Icons';
import { StreamerContentTypeIcon } from './StreamerIDCard';

export const STREAMER_CATEGORIES = [
  { id: '', label: 'Todo', icon: null },
  { id: 'gaming', label: 'Gaming', icon: 'gaming' },
  { id: 'music', label: 'Música', icon: 'music' },
  { id: 'art', label: 'Arte', icon: 'art' },
  { id: 'singing', label: 'Canto', icon: 'singing' },
  { id: 'irl', label: 'IRL', icon: 'irl' },
  { id: 'chatting', label: 'Charla', icon: 'chatting' },
  { id: 'asmr', label: 'ASMR', icon: 'asmr' },
];

interface StreamerFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  contentType: string;
  onCategoryChange: (category: string) => void;
  onlyLive: boolean;
  onToggleOnlyLive: (liveOnly: boolean) => void;
  totalResults: number;
}

export default function StreamerFilterBar({
  search,
  onSearchChange,
  contentType,
  onCategoryChange,
  onlyLive,
  onToggleOnlyLive,
  totalResults,
}: StreamerFilterBarProps) {
  return (
    <div
      className="glass"
      style={{
        padding: '18px 22px',
        borderRadius: '20px',
        marginBottom: '28px',
        background: 'rgba(20, 20, 30, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Top Row: Search Input + Only Live Toggle */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={17} />
          </div>
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre, biografía, fandom o plataforma..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              paddingLeft: '42px',
              paddingRight: search ? '38px' : '14px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              fontSize: '0.88rem',
              color: '#fff',
              width: '100%',
            }}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pill: Live Only */}
        <button
          onClick={() => onToggleOnlyLive(!onlyLive)}
          style={{
            height: '44px',
            padding: '0 18px',
            borderRadius: '12px',
            border: onlyLive ? '1px solid #ff4081' : '1px solid rgba(255, 255, 255, 0.09)',
            background: onlyLive ? 'rgba(233, 30, 99, 0.18)' : 'rgba(0, 0, 0, 0.35)',
            color: onlyLive ? '#ff4081' : 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: onlyLive ? '#ff4081' : 'var(--text-muted)',
              boxShadow: onlyLive ? '0 0 8px #ff4081' : 'none',
              animation: onlyLive ? 'streamer-pulse-dot 1.4s infinite ease-in-out' : 'none',
            }}
          />
          Solo En Vivo
        </button>
      </div>

      {/* Bottom Row: Category Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }} className="hide-scrollbar">
          {STREAMER_CATEGORIES.map(cat => {
            const isSelected = contentType === cat.id;
            return (
              <button
                key={cat.id || 'all'}
                onClick={() => onCategoryChange(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.06)',
                  background: isSelected ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.icon && <StreamerContentTypeIcon type={cat.icon} size={13} color={isSelected ? '#22d3ee' : 'var(--text-muted)'} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
          {totalResults} {totalResults === 1 ? 'Streamer' : 'Streamers'}
        </div>
      </div>
    </div>
  );
}
