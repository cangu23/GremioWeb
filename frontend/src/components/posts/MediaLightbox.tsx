'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface MediaLightboxProps {
  src: string;
  alt?: string;
  isVideo?: boolean;
  onClose: () => void;
}

export default function MediaLightbox({ src, alt = 'Media preview', isVideo = false, onClose }: MediaLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation & ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, handleZoomIn, handleZoomOut, resetZoom]);

  // Wheel zoom for images
  const handleWheel = (e: React.WheelEvent) => {
    if (isVideo) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dragging / Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1 || isVideo) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click toggles between 1x and 2x zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isVideo) return;
    e.stopPropagation();
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2);
    }
  };

  return (
    <div
      onClick={() => {
        if (!isDragging) onClose();
      }}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        userSelect: 'none',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* ===== TOP TOOLBAR ===== */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(20, 20, 35, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '30px',
          padding: '6px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100000,
        }}
      >
        {!isVideo && (
          <>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              style={{
                background: 'none',
                border: 'none',
                color: zoom <= 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: zoom <= 1 ? 'default' : 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Alejar (-)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <button
              onClick={resetZoom}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                minWidth: '54px',
                textAlign: 'center',
              }}
              title="Restablecer (0)"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              style={{
                background: 'none',
                border: 'none',
                color: zoom >= 4 ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: zoom >= 4 ? 'default' : 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Acercar (+)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
          </>
        )}

        {/* Open Original */}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255,255,255,0.8)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s',
          }}
          title="Abrir imagen original"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 77, 106, 0.2)',
            border: '1px solid rgba(255, 77, 106, 0.4)',
            color: '#ff4d6a',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginLeft: '4px',
            transition: 'all 0.2s',
          }}
          title="Cerrar (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ===== MEDIA CONTAINER ===== */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: isVideo ? 'default' : zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
      >
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            style={{
              maxWidth: '92vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{
              maxWidth: zoom === 1 ? '92vw' : 'none',
              maxHeight: zoom === 1 ? '85vh' : 'none',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* ===== BOTTOM HINT ===== */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          display: 'flex',
          gap: '16px',
        }}
      >
        <span>Doble clic / Rueda para zoom</span>
        <span>ESC para cerrar</span>
      </div>
    </div>
  );
}
