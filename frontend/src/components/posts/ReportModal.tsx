'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

// ── Types ────────────────────────────────────────────────────────────────────
interface ReportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** What's being reported: 'post' | 'comment' */
  targetType: 'post' | 'comment';
  /** ID of the post (needed for both post and comment reports) */
  postId: string;
  /** ID of the comment being reported (only for comments) */
  commentId?: string;
  /** Callback when modal closes */
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam o publicidad',
  'Contenido inapropiado',
  'Acoso o bullying',
  'Discurso de odio',
  'Desinformación',
  'Violencia o contenido sensible',
  'Infracción de derechos de autor',
  'Otro',
];

// ── Component ────────────────────────────────────────────────────────────────
export default function ReportModal({
  isOpen,
  targetType,
  postId,
  commentId,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const { showToast } = useToast();

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
      setReporting(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (reporting) return;
    setReason('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setReporting(true);
    try {
      const url = targetType === 'post'
        ? `/posts/${postId}/report`
        : `/posts/comments/${commentId}/report`;

      await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim(),
          description: description.trim() || undefined,
        }),
      });

      showToast('Reporte enviado. Gracias por ayudar a mantener la comunidad segura.', 'success');
      handleClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al enviar el reporte', 'error');
    } finally {
      setReporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'rmFadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'rmZoomIn 0.2s ease-out',
          position: 'relative',
        }}
      >
        {/* Top gradient line */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #ff9800, #f57c00)',
            borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,152,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
              Reportar {targetType === 'post' ? 'publicación' : 'comentario'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ayúdanos a mantener la comunidad segura.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              className="form-label"
              style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}
            >
              Motivo del reporte
            </label>
            <select
              className="input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              style={{ width: '100%' }}
            >
              <option value="">Selecciona un motivo...</option>
              {REPORT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label
              className="form-label"
              style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}
            >
              Descripción adicional{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Añade más contexto sobre el reporte..."
              rows={3}
              maxLength={500}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={reporting}
              style={{
                padding: '8px 20px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: 'var(--text)',
                cursor: 'pointer', fontSize: '0.85rem',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={reporting || !reason}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: !reason
                  ? 'rgba(255,152,0,0.3)'
                  : 'linear-gradient(135deg, #ff9800, #f57c00)',
                color: 'white',
                cursor: !reason ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              {reporting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes rmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rmZoomIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
