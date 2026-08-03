import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  cropType: 'avatar' | 'banner' | 'free';
  title?: string;
  isGif?: boolean;
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  cropType,
  title = 'Editar Imagen',
  isGif: isGifProp,
  onCropComplete,
  onClose,
}: ImageCropperModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Detect GIF
  const isGif = isGifProp || Boolean(
    imageSrc && (
      imageSrc.toLowerCase().includes('.gif') ||
      imageSrc.startsWith('data:image/gif')
    )
  );

  // Aspect ratios
  // Avatar: 1:1, Banner: 3:1 (e.g. 1200x400)
  const targetAspect = cropType === 'avatar' ? 1 : cropType === 'banner' ? 3 : 1.5;

  // Redraw canvas whenever transforms change
  const drawCanvas = useCallback(() => {
    if (isGif) return; // Skip canvas redrawing for GIFs to prevent flickering
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    ctx.save();

    // Center origin
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Calculate base fit scale
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW: number;
    let drawH: number;

    if (imgAspect > targetAspect) {
      // Image is wider
      drawH = height * zoom;
      drawW = drawH * imgAspect;
    } else {
      // Image is taller
      drawW = width * zoom;
      drawH = drawW / imgAspect;
    }

    // Draw centered
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  }, [zoom, rotation, flipH, flipV, pan, targetAspect, isGif]);

  // Reset transforms when imageSrc or cropType changes
  useEffect(() => {
    imageRef.current = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (imageSrc) {
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setPan({ x: 0, y: 0 });

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        // Fallback without crossOrigin if CORS blocks anonymous load
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          imageRef.current = fallbackImg;
          drawCanvas();
        };
        fallbackImg.src = imageSrc;
      };
      img.src = imageSrc;
    }
  }, [imageSrc, cropType, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Dragging / Pan handling
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.1, 3.5));
    } else {
      setZoom(prev => Math.max(prev - 0.1, 0.5));
    }
  };

  // Keep raw animated GIF without destroying animation
  const handleKeepOriginalGif = async () => {
    if (!imageSrc) return;
    setProcessing(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const gifBlob = new Blob([blob], { type: 'image/gif' });
      setProcessing(false);
      onCropComplete(gifBlob);
    } catch {
      setProcessing(false);
    }
  };

  // Export cropped static image
  const handleExport = async () => {
    const img = imageRef.current;
    if (!img) {
      if (isGif) {
        handleKeepOriginalGif();
        return;
      }
      return;
    }
    setProcessing(true);

    try {
      // Output dimensions
      const outW = cropType === 'banner' ? 1200 : 500;
      const outH = cropType === 'banner' ? 400 : 500;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = outW;
      exportCanvas.height = outH;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) throw new Error('No 2D context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw background if transparent
      ctx.fillStyle = '#121222';
      ctx.fillRect(0, 0, outW, outH);

      // Save context
      ctx.save();
      ctx.translate(outW / 2, outH / 2);

      // Scale pan according to export resolution vs canvas display resolution
      const displayCanvas = canvasRef.current;
      const scaleFactor = displayCanvas ? outW / displayCanvas.width : 1;

      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW: number;
      let drawH: number;

      if (imgAspect > targetAspect) {
        drawH = outH * zoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = outW * zoom;
        drawH = drawW / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      exportCanvas.toBlob(
        (blob) => {
          setProcessing(false);
          if (blob) {
            onCropComplete(blob);
          }
        },
        'image/webp',
        0.92
      );
    } catch {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc || !mounted || typeof document === 'undefined') return null;

  const frameWidth = cropType === 'banner' ? 480 : 300;
  const frameHeight = cropType === 'banner' ? 160 : 300;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#16162a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInUp 0.25s ease-out',
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              {title}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {cropType === 'avatar' ? 'Ajusta tu foto de perfil (1:1)' : 'Ajusta tu banner (3:1)'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* GIF NOTICE BANNER */}
        {isGif && (
          <div style={{
            padding: '10px 20px',
            background: 'rgba(236,72,153,0.12)',
            borderBottom: '1px solid rgba(236,72,153,0.25)',
            color: '#f472b6',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>✨</span>
            <span><strong>GIF Animado detectado:</strong> Puedes conservarlo animado o recortarlo como imagen fija.</span>
          </div>
        )}

        {/* CANVAS / IMG VIEWPORT */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          style={{
            padding: '24px',
            background: '#0d0d18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            minHeight: '320px',
          }}
        >
          {/* Crop Frame Box */}
          <div
            style={{
              width: `${frameWidth}px`,
              height: `${frameHeight}px`,
              borderRadius: cropType === 'avatar' ? '50%' : '12px',
              border: '2px dashed var(--primary)',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Smooth GIF preview vs Canvas static preview */}
          {isGif ? (
            <img
              src={imageSrc}
              alt="GIF Preview"
              style={{
                position: 'absolute',
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
                objectFit: 'cover',
                borderRadius: cropType === 'avatar' ? '50%' : '12px',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={frameWidth}
              height={frameHeight}
              style={{
                position: 'absolute',
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
                borderRadius: cropType === 'avatar' ? '50%' : '12px',
                zIndex: 1,
              }}
            />
          )}
        </div>

        {/* CONTROLS */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '48px' }}>Zoom</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Transform Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
              style={actionBtnStyle}
              title="Rotar a la izquierda"
            >
              ⟲ Rotar -90°
            </button>
            <button
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              style={actionBtnStyle}
              title="Rotar a la derecha"
            >
              ⟳ Rotar +90°
            </button>
            <button
              type="button"
              onClick={() => setFlipH(prev => !prev)}
              style={{ ...actionBtnStyle, background: flipH ? 'rgba(139,92,246,0.2)' : actionBtnStyle.background }}
              title="Voltear horizontal"
            >
              ⇄ Voltear
            </button>
            <button
              type="button"
              onClick={() => { setZoom(1); setRotation(0); setFlipH(false); setFlipV(false); setPan({ x: 0, y: 0 }); }}
              style={actionBtnStyle}
              title="Reiniciar"
            >
              ↺ Reiniciar
            </button>
          </div>

          {/* FOOTER ACTIONS */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.88rem',
              }}
            >
              Cancelar
            </button>

            {isGif && (
              <button
                type="button"
                onClick={handleKeepOriginalGif}
                disabled={processing}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(236,72,153,0.35)',
                }}
              >
                {processing ? 'Procesando...' : '✨ Conservar GIF Animado'}
              </button>
            )}

            <button
              type="button"
              onClick={handleExport}
              disabled={processing}
              className="btn"
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: isGif ? 'rgba(255,255,255,0.08)' : undefined,
                color: isGif ? 'var(--text)' : undefined,
                border: isGif ? '1px solid rgba(255,255,255,0.2)' : undefined,
              }}
            >
              {processing ? 'Guardando...' : isGif ? 'Guardar (Fijo)' : 'Guardar y Aplicar'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: 500,
  transition: 'all 0.15s',
};
