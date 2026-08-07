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

export function extractTwitchChannel(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;
  let clean = input.trim().replace(/^@/, '');

  if (clean.includes('twitch.tv')) {
    try {
      const urlStr = clean.startsWith('http') ? clean : `https://${clean}`;
      const urlObj = new URL(urlStr);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const candidate = parts[0].toLowerCase();
        if (/^[a-zA-Z0-9_]{2,25}$/.test(candidate) && candidate !== 'directory' && candidate !== 'videos') {
          return candidate;
        }
      }
    } catch {
      // ignore
    }
  }

  const match = clean.match(/twitch\.tv\/([a-zA-Z0-9_]{2,25})/i);
  if (match) return match[1].toLowerCase();

  const plainMatch = clean.match(/^[a-zA-Z0-9_]{2,25}$/);
  if (plainMatch) return plainMatch[0].toLowerCase();

  return null;
}

export function extractYoutubeEmbed(input: string | null | undefined): { embedUrl: string; channelOrId: string; rawUrl: string } | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();

  const channelMatch = clean.match(/(?:youtube\.com\/@)([a-zA-Z0-9_-]+)/i);
  if (channelMatch) {
    const handle = channelMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/live_stream?channel=${handle}&autoplay=1&muted=1`,
      channelOrId: handle,
      rawUrl: clean.startsWith('http') ? clean : `https://youtube.com/@${handle}`,
    };
  }

  const videoMatch = clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (videoMatch) {
    const videoId = videoMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&muted=1`,
      channelOrId: videoId,
      rawUrl: clean.startsWith('http') ? clean : `https://youtube.com/watch?v=${videoId}`,
    };
  }

  return null;
}

export function extractKickChannel(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim().replace(/^@/, '');
  if (clean.includes('kick.com')) {
    try {
      const urlStr = clean.startsWith('http') ? clean : `https://${clean}`;
      const urlObj = new URL(urlStr);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length > 0 && /^[a-zA-Z0-9_]{2,25}$/.test(parts[0])) {
        return parts[0].toLowerCase();
      }
    } catch {}
  }
  const match = clean.match(/kick\.com\/([a-zA-Z0-9_]{2,25})/i);
  if (match) return match[1].toLowerCase();
  if (/^[a-zA-Z0-9_]{2,25}$/.test(clean)) return clean.toLowerCase();
  return null;
}

export function getEmbedInfo(profile: VTuberProfile): EmbedInfo | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname || 'localhost';
  const parentParams = `parent=${encodeURIComponent(host)}&parent=localhost&parent=127.0.0.1`;

  // 1. Twitch
  const twitchChannel = extractTwitchChannel(profile.twitchUrl);
  if (twitchChannel) {
    return {
      embedUrl: `https://player.twitch.tv/?channel=${twitchChannel}&${parentParams}&autoplay=true&muted=true`,
      platform: 'twitch',
      channelOrId: twitchChannel,
      rawUrl: `https://twitch.tv/${twitchChannel}`,
    };
  }

  // 2. YouTube
  const ytInfo = extractYoutubeEmbed(profile.youtubeUrl);
  if (ytInfo) {
    return {
      embedUrl: ytInfo.embedUrl,
      platform: 'youtube',
      channelOrId: ytInfo.channelOrId,
      rawUrl: ytInfo.rawUrl,
    };
  }

  // 3. Kick
  const kickChannel = extractKickChannel(profile.kickUrl);
  if (kickChannel) {
    return {
      embedUrl: `https://player.kick.com/${kickChannel}`,
      platform: 'kick',
      channelOrId: kickChannel,
      rawUrl: `https://kick.com/${kickChannel}`,
    };
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
        maxWidth: '860px',
        margin: '0 auto 36px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'rgba(15, 15, 23, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(233, 30, 99, 0.3)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(233, 30, 99, 0.15)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Bar / Channel Switcher */}
      <div
        style={{
          padding: '12px 18px',
          background: 'rgba(20, 20, 30, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Live Badge Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '4px 11px',
              borderRadius: '20px',
              background: 'rgba(233, 30, 99, 0.2)',
              border: '1px solid rgba(233, 30, 99, 0.5)',
              color: '#ff4081',
              fontSize: '0.72rem',
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
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ff4081',
                boxShadow: '0 0 8px #ff4081',
                animation: 'vtuber-pulse-dot 1.4s infinite ease-in-out',
              }}
            />
            TRANSMITIENDO EN VIVO
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {liveVtubers.length} {liveVtubers.length === 1 ? 'canal activo' : 'canales activos'}
          </span>
        </div>

        {/* Multi-Streamer Switcher Pills (If > 1 live) */}
        {liveVtubers.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
            {liveVtubers.map((v, idx) => {
              const isSelected = idx === activeIndexBounded;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: isSelected ? '1px solid #ff4081' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(233, 30, 99, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
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
          gridTemplateColumns: showChat && embed?.platform === 'twitch' ? '1fr 300px' : '1fr',
          position: 'relative',
          background: '#09090d',
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
                gap: '12px',
                background: 'linear-gradient(135deg, #12121c, #1a1a28)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(233, 30, 99, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={24} color="#ff4081" />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: '0 0 4px 0' }}>
                  {activeVtuber.displayName} está transmitiendo en directo
                </h4>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                  Asegúrate de agregar tu enlace de Twitch, YouTube o Kick en tu perfil.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side Chat (If Twitch & enabled) */}
        {showChat && embed?.platform === 'twitch' && (
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', background: '#0d0d14', height: '100%', minHeight: '340px' }}>
            <iframe
              src={`https://www.twitch.tv/embed/${embed.channelOrId}/chat?parent=${encodeURIComponent(hostName)}&parent=localhost&parent=127.0.0.1&darkpopout`}
              title="Chat en vivo"
              height="100%"
              width="100%"
              style={{ border: 'none', minHeight: '340px' }}
            />
          </div>
        )}
      </div>

      {/* Streamer Detail Footer */}
      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(18, 18, 28, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Streamer Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: activeVtuber.avatarUrl
                ? `url(${activeVtuber.avatarUrl}) center/cover`
                : 'var(--primary)',
              border: '2px solid #ff4081',
              boxShadow: '0 0 10px rgba(233, 30, 99, 0.4)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeVtuber.displayName}
              </h3>
              {activeVtuber.isVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="var(--primary)" />
                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '1px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{activeVtuber.user.username} {activeVtuber.contentType ? `• ${activeVtuber.contentType}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {embed?.platform === 'twitch' && (
            <button
              onClick={() => setShowChat(prev => !prev)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: showChat ? 'rgba(145, 70, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: showChat ? '1px solid #9146FF' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showChat ? '#a970ff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
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
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(233, 30, 99, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {embed.platform === 'twitch' && <Twitch size={14} color="#fff" />}
              {embed.platform === 'youtube' && <Youtube size={14} color="#fff" />}
              <span>Ver en Canal</span>
              <ExternalLink size={12} color="#fff" />
            </a>
          )}

          <Link
            href={`/profile/${activeVtuber.userId}`}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.8rem',
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
