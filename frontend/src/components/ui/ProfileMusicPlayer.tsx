'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music } from '@/components/ui/Icons';
import { isSpotifyUrl, toSpotifyEmbedUrl, getSpotifyEmbedHeight } from '@gremio-estelar/shared';

interface ProfileMusicPlayerProps {
  musicUrl?: string | null;
  displayName?: string;
}

export default function ProfileMusicPlayer({ musicUrl, displayName }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(false);
  const [spotifyOpen, setSpotifyOpen] = useState(false);

  const spotifyEmbedUrl = musicUrl ? toSpotifyEmbedUrl(musicUrl) : null;
  const isSpotify = isSpotifyUrl(musicUrl);

  useEffect(() => {
    setIsPlaying(false);
    setError(false);
    setSpotifyOpen(false);
  }, [musicUrl]);

  if (!musicUrl) return null;

  const label = displayName ? `Música de ${displayName}` : 'Música de Perfil';

  /* ─────────────── SPOTIFY EMBED MODE (official player) ─────────────── */
  if (isSpotify && spotifyEmbedUrl) {
    const embedHeight = getSpotifyEmbedHeight(spotifyEmbedUrl);
    return (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 999,
        width: 'min(360px, calc(100vw - 40px))',
      }}>
        {/* Header pill — tap to expand/collapse */}
        <div
          onClick={() => setSpotifyOpen(o => !o)}
          role="button"
          aria-expanded={spotifyOpen}
          title={spotifyOpen ? 'Cerrar reproductor de Spotify' : 'Abrir reproductor de Spotify'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            borderRadius: '20px',
            background: 'rgba(20, 16, 38, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(29, 185, 84, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(29, 185, 84, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            animation: 'fadeInUp 0.4s ease-out',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,0,0,0.6), 0 0 26px rgba(29,185,84,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(29,185,84,0.2)'; }}
        >
          {/* Rotating Vinyl Record Icon (Spotify green) */}
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #1db954, #0f5e2e 70%)',
            border: '2px solid rgba(29, 185, 84, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(29, 185, 84, 0.55)',
            animation: spotifyOpen ? 'vinylSpin 4s linear infinite' : 'none',
            flexShrink: 0,
          }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#0b2e1a',
              border: '1px solid rgba(255,255,255,0.4)',
            }} />
          </div>

          {/* Info & Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0', flex: 1 }}>
            <div style={{
              fontSize: '0.78rem', fontWeight: 800, color: '#f5e6d3',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Music size={13} color="#1db954" />
              <span>{label}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 }}>
              {spotifyOpen ? 'Toca para cerrar ▲' : 'Reproductor oficial de Spotify — toca para abrir ▶'}
            </div>
          </div>

          {/* Expand chevron */}
          <span style={{ color: '#1db954', fontSize: '0.85rem', fontWeight: 900, flexShrink: 0 }}>
            {spotifyOpen ? '✕' : '▾'}
          </span>
        </div>

        {/* Spotify iframe */}
        {spotifyOpen && (
          <div style={{
            marginTop: '8px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(29, 185, 84, 0.3)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            background: '#121212',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height={embedHeight}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={label}
              style={{ border: 'none', display: 'block' }}
            />
          </div>
        )}

        <style>{`
          @keyframes vinylSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /* ─────────────── LEGACY AUDIO MODE (direct MP3 / stream) ─────────────── */
  const togglePlay = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(false);
      }
    } catch {
      setError(true);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      borderRadius: '20px',
      background: 'rgba(20, 16, 38, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(192, 132, 252, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(138, 43, 226, 0.2)',
      animation: 'fadeInUp 0.4s ease-out',
    }}>
      <audio ref={audioRef} src={musicUrl} loop preload="auto" onError={() => setError(true)} />

      {/* Rotating Vinyl Record Icon */}
      <div style={{
        position: 'relative',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #18181b, #3f3f46)',
        border: '2px solid rgba(192, 132, 252, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isPlaying ? '0 0 16px rgba(192, 132, 252, 0.6)' : 'none',
        animation: isPlaying ? 'vinylSpin 3s linear infinite' : 'none',
        flexShrink: 0,
      }}>
        {/* Vinyl Center Hole */}
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        }} />
      </div>

      {/* Info & Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px', maxWidth: '180px' }}>
        <div style={{
          fontSize: '0.78rem', fontWeight: 800, color: '#f5e6d3',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <Music size={13} color="#c084fc" />
          <span>{label}</span>
        </div>

        {/* Status indicator */}
        <div style={{ fontSize: '0.7rem', color: isPlaying ? '#c084fc' : 'var(--text-muted)', fontWeight: 600 }}>
          {error ? '⚠️ Error al cargar audio' : isPlaying ? 'Sonando en vivo 🎶' : 'Haz clic para escuchar 🎵'}
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={error}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: isPlaying ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: error ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          transition: 'transform 0.2s ease',
          opacity: error ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!error) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { if (!error) e.currentTarget.style.transform = 'scale(1)'; }}
        title={isPlaying ? 'Pausar música' : 'Reproducir música de fondo'}
      >
        {isPlaying ? (
          <span style={{ fontSize: '1rem', fontWeight: 900 }}>❚❚</span>
        ) : (
          <span style={{ fontSize: '1.1rem', fontWeight: 900, marginLeft: '2px' }}>▶</span>
        )}
      </button>

      {/* Mute Toggle Button */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          style={{
            background: 'none', border: 'none', color: isMuted ? '#ef4444' : '#c084fc',
            cursor: 'pointer', fontSize: '0.9rem', padding: '4px', display: 'flex', alignItems: 'center',
          }}
          title={isMuted ? 'Desilenciar' : 'Silenciar'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}

      {/* CSS Keyframes for Vinyl Rotation */}
      <style>{`
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
