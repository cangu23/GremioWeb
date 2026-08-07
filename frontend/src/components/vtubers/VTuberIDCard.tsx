'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star,
  Users,
  FileText,
  Twitch,
  Youtube,
  Twitter,
  Discord,
  Globe,
  Gamepad,
  Music,
  Palette,
  Mic,
  Headphones,
  MessageSquare,
  Sparkles,
  ExternalLink
} from '@/components/ui/Icons';

export interface VTuberUser {
  id: string;
  username: string;
  role: string;
  _count: { followers: number; following: number; posts: number };
}

export interface VTuberProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  lore: string | null;
  isLive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  kickUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  streamSchedule: string | null;
  languages: string | null;
  contentType: string | null;
  fanName: string | null;
  oshiMark: string | null;
  themeColor: string | null;
  user: VTuberUser;
}

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
}

export function ContentTypeIcon({ type, size = 13, color = 'var(--primary)' }: { type: string; size?: number; color?: string }) {
  const props = { size, color, strokeWidth: 2 };
  switch (type.toLowerCase()) {
    case 'gaming':
      return <Gamepad {...props} />;
    case 'music':
      return <Music {...props} />;
    case 'art':
      return <Palette {...props} />;
    case 'singing':
      return <Mic {...props} />;
    case 'asmr':
      return <Headphones {...props} />;
    case 'chatting':
    case 'just-chatting':
    default:
      return <MessageSquare {...props} />;
  }
}

interface VTuberIDCardProps {
  vtuber: VTuberProfile;
  compact?: boolean;
}

export default function VTuberIDCard({ vtuber, compact = false }: VTuberIDCardProps) {
  const langs = parseLanguages(vtuber.languages);
  const theme = vtuber.themeColor || 'var(--primary)';
  const idSnippet = vtuber.id ? vtuber.id.slice(0, 5).toUpperCase() : '000';

  return (
    <Link href={`/profile/${vtuber.userId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div
        className="vtuber-id-card glass"
        style={{
          position: 'relative',
          borderRadius: '18px',
          padding: compact ? '16px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          overflow: 'hidden',
          background: 'rgba(18, 18, 26, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
          e.currentTarget.style.borderColor = theme;
          e.currentTarget.style.boxShadow = `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${theme}33`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        }}
      >
        {/* Top Banner Accent / Micro-Grid pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: vtuber.bannerUrl
              ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(18,18,26,0.95)), url(${vtuber.bannerUrl}) center/cover`
              : `radial-gradient(ellipse at top left, ${theme}40, transparent 70%), linear-gradient(135deg, rgba(139,92,246,0.1), transparent)`,
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            zIndex: 0,
          }}
        />

        {/* Content Container */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
          
          {/* Header Row: ID Tag & Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme }} />
              GUILD ID • #{idSnippet}
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {vtuber.isLive && (
                <div
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(233, 30, 99, 0.2)',
                    border: '1px solid rgba(233, 30, 99, 0.5)',
                    color: '#ff4081',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 0 12px rgba(233,30,99,0.3)',
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
                  EN VIVO
                </div>
              )}

              {!vtuber.isLive && vtuber.isFeatured && (
                <div
                  style={{
                    padding: '3px 9px',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Star size={11} color="#f59e0b" fill="#f59e0b" /> VIP
                </div>
              )}
            </div>
          </div>

          {/* Main Character Row: Avatar + Name + Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
            {/* Holographic Avatar Halo */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  padding: '2px',
                  background: vtuber.isLive
                    ? 'linear-gradient(135deg, #ff4081, #9c27b0, #7c3aed)'
                    : `linear-gradient(135deg, ${theme}, rgba(255,255,255,0.2))`,
                  boxShadow: vtuber.isLive ? '0 0 16px rgba(255,64,129,0.4)' : `0 0 12px ${theme}22`,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: vtuber.avatarUrl
                      ? `url(${vtuber.avatarUrl}) center/cover`
                      : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    overflow: 'hidden',
                  }}
                >
                  {!vtuber.avatarUrl && vtuber.displayName.charAt(0).toUpperCase()}
                </div>
              </div>

              {vtuber.isLive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#ff4081',
                    border: '2px solid #12121a',
                    boxShadow: '0 0 8px #ff4081',
                    animation: 'vtuber-pulse-dot 1.4s infinite ease-in-out',
                  }}
                />
              )}
            </div>

            {/* Display Name & Handle */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#fff',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {vtuber.displayName}
                </h3>
                {vtuber.isVerified && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <title>VTuber Verificado</title>
                    <circle cx="12" cy="12" r="10" fill="var(--primary)" />
                    <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{vtuber.user.username}
              </div>

              {/* Oshi Mark & Fan Name Pills */}
              {(vtuber.oshiMark || vtuber.fanName) && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                  {vtuber.oshiMark && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      title="Oshi Mark"
                    >
                      {vtuber.oshiMark}
                    </span>
                  )}
                  {vtuber.fanName && (
                    <span
                      style={{
                        padding: '1px 8px',
                        borderRadius: '6px',
                        background: `${theme}18`,
                        color: theme,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: `1px solid ${theme}30`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px',
                      }}
                      title={`Fans: ${vtuber.fanName}`}
                    >
                      #{vtuber.fanName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description Snippet */}
          {vtuber.description && !compact && (
            <p
              style={{
                fontSize: '0.83rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {vtuber.description}
            </p>
          )}

          {/* Categories & Languages Bar */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {vtuber.contentType && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: 'var(--primary-hover)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                }}
              >
                <ContentTypeIcon type={vtuber.contentType} size={12} color="var(--primary-hover)" />
                {vtuber.contentType.charAt(0).toUpperCase() + vtuber.contentType.slice(1)}
              </span>
            )}

            {langs.slice(0, 2).map(lang => (
              <span
                key={lang}
                style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-muted)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  textTransform: 'uppercase',
                }}
              >
                {lang}
              </span>
            ))}
            {langs.length > 2 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                +{langs.length - 2}
              </span>
            )}
          </div>

          {/* Footer Stats & Social Links */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Seguidores">
                <Users size={13} color="var(--text-muted)" />
                {vtuber.user?._count?.followers || 0}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Publicaciones">
                <FileText size={13} color="var(--text-muted)" />
                {vtuber.user?._count?.posts || 0}
              </span>
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {vtuber.twitchUrl && <Twitch size={15} color="#9146FF" title="Twitch" />}
              {vtuber.youtubeUrl && <Youtube size={15} color="#FF0000" title="YouTube" />}
              {vtuber.kickUrl && (
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#53FC18', letterSpacing: '-0.05em' }} title="Kick">
                  KICK
                </span>
              )}
              {vtuber.twitterUrl && <Twitter size={14} color="#1DA1F2" title="Twitter / X" />}
              {vtuber.discordUrl && <Discord size={14} color="#5865F2" title="Discord" />}
              {vtuber.websiteUrl && <Globe size={14} color="var(--text-muted)" title="Website" />}
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
