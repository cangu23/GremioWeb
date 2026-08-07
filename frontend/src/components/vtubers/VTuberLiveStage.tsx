'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VTuberProfile } from './VTuberIDCard';
import { Twitch, Youtube, ExternalLink, Users, Sparkles, MessageSquare, ChevronDown } from '@/components/ui/Icons';

export interface EmbedInfo {
  embedUrl: string;
  platform: 'twitch' | 'youtube' | 'kick' | 'unknown';
  channelOrId: string;
  rawUrl: string;
}

export function getEmbedInfo(profile: VTuberProfile): EmbedInfo | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname || 'localhost';
  const parentParams = `parent=${encodeURIComponent(host)}&parent=localhost&parent=127.0.0.1`;

  // 1. Twitch
  if (profile.twitchUrl && profile.twitchUrl.trim()) {
    const clean = profile.twitchUrl.trim();
    const match = clean.match(/(?:twitch\.tv\/)?([a-zA-Z0-9_]{2,25})/i);
    if (match) {
      const channel = match[1].toLowerCase();
      return {
        embedUrl: `https://player.twitch.tv/?channel=${channel}&${parentParams}&autoplay=true&muted=true`,
        platform: 'twitch',
        channelOrId: channel,
        rawUrl: clean.startsWith('http') ? clean : `https://twitch.tv/${channel}`,
      };
    }
  }

  // 2. YouTube
  if (profile.youtubeUrl && profile.youtubeUrl.trim()) {
    const clean = profile.youtubeUrl.trim();
    const channelMatch = clean.match(/(?:youtube\.com\/@)([a-zA-Z0-9_]+)/i);
    if (channelMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}&autoplay=1&muted=1`,
        platform: 'youtube',
        channelOrId: channelMatch[1],
        rawUrl: clean.startsWith('http') ? clean : `https://youtube.com/@${channelMatch[1]}`,
      };
    }
    const videoMatch = clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
    if (videoMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoMatch[1]}?autoplay=1&muted=1`,
        platform: 'youtube',
        channelOrId: videoMatch[1],
        rawUrl: clean.startsWith('http') ? clean : `https://youtube.com/watch?v=${videoMatch[1]}`,
      };
    }
  }

  // 3. Kick
  if (profile.kickUrl && profile.kickUrl.trim()) {
    const clean = profile.kickUrl.trim();
    const match = clean.match(/(?:kick\.com\/)?([a-zA-Z0-9_]{2,25})/i);
    if (match) {
      const channel = match[1].toLowerCase();
      return {
        embedUrl: `https://player.kick.com/${channel}`,
        platform: 'kick',
        channelOrId: channel,
        rawUrl: clean.startsWith('http') ? clean : `https://kick.com/${channel}`,
      };
    }
  }

  return null;
}

interface VTuberLiveStageProps {
  liveVtubers: VTuberProfile[];
}

export default function VTuberLiveStage({ liveVtubers }: VTuberLiveStageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);

  // CRITICAL REQUIREMENT: Render NOTHING if no streamer is live!
  if (!liveVtubers || liveVtubers.length === 0) {
    return null;
  }

  const activeIndexBounded = activeIndex >= liveVtubers.length ? 0 : activeIndex;
  const activeVtuber = liveVtubers[activeIndexBounded];
  const embed = activeVtuber ? getEmbedInfo(activeVtuber) : null;
  const hostName = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  return (
    <div
      className="vtuber-live-stage"
      style={{
        marginBottom: '40px',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'rgba(15, 15, 23, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(233, 30, 99, 0.25)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(233, 30, 99, 0.15)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Bar / Channel Switcher */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(20, 20, 30, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Live Badge Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              background: 'rgba(233, 30, 99, 0.2)',
              border: '1px solid rgba(233, 30, 99, 0.5)',
              color: '#ff4081',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(233, 30, 99, 0.3)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#ff4081',
                boxShadow: '0 0 8px #ff4081',
                animation: 'vtuber-pulse-dot 1.4s infinite ease-in-out',
              }}
            />
            TRANSMITIENDO EN VIVO
          </div>

          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {liveVtubers.length} {liveVtubers.length === 1 ? 'canal activo' : 'canales activos'}
          </span>
        </div>

        {/* Multi-Streamer Switcher Pills (If > 1 live) */}
        {liveVtubers.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px' }}>
            {liveVtubers.map((v, idx) => {
              const isSelected = idx === activeIndexBounded;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '14px',
                    border: isSelected ? '1px solid #ff4081' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(233, 30, 99, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: v.avatarUrl
                        ? `url(${v.avatarUrl}) center/cover`
                        : 'var(--primary)',
                      border: isSelected ? '1.5px solid #ff4081' : 'none',
                    }}
                  />
                  <span>{v.displayName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Theater Screen Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showChat && embed?.platform === 'twitch' ? '1fr 340px' : '1fr',
          position: 'relative',
          background: '#09090d',
          minHeight: '380px',
        }}
      >
        {/* Video Player */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
          {embed ? (
            <iframe
              src={embed.embedUrl}
              title={`Stream en vivo de ${activeVtuber.displayName}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '14px',
                background: 'linear-gradient(135deg, #12121c, #1a1a28)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(233, 30, 99, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={28} color="#ff4081" />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700, margin: '0 0 4px 0' }}>
                  {activeVtuber.displayName} está transmitiendo en directo
                </h4>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  Visita su canal directamente para sintonizar la transmisión.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side Chat (If Twitch & enabled) */}
        {showChat && embed?.platform === 'twitch' && (
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', background: '#0d0d14', height: '100%', minHeight: '380px' }}>
            <iframe
              src={`https://www.twitch.tv/embed/${embed.channelOrId}/chat?parent=${encodeURIComponent(hostName)}&parent=localhost&parent=127.0.0.1&darkpopout`}
              title="Chat en vivo"
              height="100%"
              width="100%"
              style={{ border: 'none', minHeight: '380px' }}
            />
          </div>
        )}
      </div>

      {/* Streamer Detail Footer */}
      <div
        style={{
          padding: '16px 22px',
          background: 'rgba(18, 18, 28, 0.85)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Streamer Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: activeVtuber.avatarUrl
                ? `url(${activeVtuber.avatarUrl}) center/cover`
                : 'var(--primary)',
              border: '2px solid #ff4081',
              boxShadow: '0 0 12px rgba(233, 30, 99, 0.4)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeVtuber.displayName}
              </h3>
              {activeVtuber.isVerified && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="var(--primary)" />
                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{activeVtuber.user.username} {activeVtuber.contentType ? `• ${activeVtuber.contentType}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          {embed?.platform === 'twitch' && (
            <button
              onClick={() => setShowChat(prev => !prev)}
              style={{
                padding: '9px 16px',
                borderRadius: '12px',
                background: showChat ? 'rgba(145, 70, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: showChat ? '1px solid #9146FF' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showChat ? '#a970ff' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <MessageSquare size={14} color={showChat ? '#a970ff' : 'var(--text-secondary)'} />
              {showChat ? 'Ocultar Chat' : 'Chat Twitch'}
            </button>
          )}

          {embed?.rawUrl && (
            <a
              href={embed.rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(233, 30, 99, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {embed.platform === 'twitch' && <Twitch size={14} color="#fff" />}
              {embed.platform === 'youtube' && <Youtube size={14} color="#fff" />}
              <span>Ver en Canal</span>
              <ExternalLink size={13} color="#fff" />
            </a>
          )}

          <Link
            href={`/profile/${activeVtuber.userId}`}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            Perfil VTuber
          </Link>
        </div>
      </div>
    </div>
  );
}
