'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

// ── Types ────────────────────────────────────────────────────────────────────
interface ModerateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The name of what's being moderated: 'post' | 'comment' */
  targetType: 'post' | 'comment';
  /** ID of the post (needed for comment moderation) */
  postId?: string;
  /** ID of the specific target being moderated */
  targetId?: string;
  /** Content preview text (first 200 chars) */
  contentPreview?: string;
  /** Author username for display */
  authorName?: string;
  /** Author user ID for display */
  authorId?: string;
  /** Whether the current user is staff (ADMIN/MODERATOR) */
  isStaff: boolean;
  /** Whether the current user is the owner of the content */
  isOwner: boolean;
  /** Callback when the modal closes */
  onClose: () => void;
  /** Callback after successful deletion */
  onDeleted?: () => void;
}

// ── Quick phrases ────────────────────────────────────────────────────────────
const QUICK_PHRASES = [
  'Contenido inapropiado',
  'Spam',
  'Acoso',
  'Discurso de odio',
];

// ── Component ────────────────────────────────────────────────────────────────
export default function ModerateModal({
  isOpen,
  targetType,
  postId,
  targetId,
  contentPreview,
  authorName,
  authorId,
  isStaff,
  isOwner,
  onClose,
  onDeleted,
}: ModerateModalProps) {
  const [moderationNote, setModerationNote] = useState('');
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const isModerating = isStaff && !isOwner;

  // Focus the textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let the portal mount
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setModerationNote('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModerationNote('');
      setDeleting(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!targetId) return;
    setDeleting(true);
    try {
      const url = targetType === 'post'
        ? `/posts/${targetId}`
        : `/posts/comments/${targetId}`;

      await apiFetch(url, {
        method: 'DELETE',
        body: JSON.stringify({ moderationNote: moderationNote.trim() || undefined }),
      });

      showToast(
        targetType === 'post'
          ? 'Publicación eliminada correctamente.'
          : 'Comentario eliminado correctamente.',
        'success'
      );
      onClose();
      onDeleted?.();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Error al eliminar',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div
      onClick={() => {
        if (!deleting) { onClose(); setModerationNote(''); }
      }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'mmFadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '0',
          maxWidth: isModerating ? '540px' : '420px', width: '92%',
          boxShadow: isModerating
            ? '0 25px 80px rgba(255,77,106,0.15), 0 0 0 1px rgba(255,77,106,0.1)'
            : '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'mmZoomIn 0.25s ease-out',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            padding: '24px 28px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'flex-start', gap: '14px',
          }}
        >
          <div
            style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: isModerating
                ? 'linear-gradient(135deg, rgba(255,77,106,0.2), rgba(255,26,79,0.1))'
                : 'rgba(255,77,106,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isModerating ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              {isModerating
                ? `🛡️ Moderar ${targetType === 'post' ? 'publicación' : 'comentario'}`
                : `Eliminar ${targetType === 'post' ? 'publicación' : 'comentario'}`}
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {isModerating
                ? `Este ${targetType === 'post' ? 'contenido' : 'comentario'} infringe las normas de la comunidad. Al eliminarlo, se notificará al autor.`
                : '¿Estás seguro? Esta acción no se puede deshacer.'}
            </p>
          </div>
        </div>

        {/* ── BODY (scrollable) ── */}
        <div style={{ padding: '16px 28px', overflowY: 'auto', flex: 1 }}>
          {/* Content preview for moderation */}
          {isModerating && contentPreview && (
            <div
              style={{
                background: 'rgba(255,77,106,0.05)',
                border: '1px solid rgba(255,77,106,0.12)',
                borderRadius: '10px', padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem', color: '#ff4d6a', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Vista previa del contenido
              </div>
              <p
                style={{
                  margin: 0, fontSize: '0.85rem', lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.75)', wordBreak: 'break-word',
                }}
              >
                {contentPreview.substring(0, 200)}{contentPreview.length > 200 ? '...' : ''}
              </p>
            </div>
          )}

          {/* Author info for moderation */}
          {isModerating && authorName && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '18px', padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.75rem', fontWeight: 'bold',
                }}
              >
                {(authorName || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                  {authorName || 'Usuario'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Autor del {targetType === 'post' ? 'la publicación' : 'comentario'}
                </div>
              </div>
              <span
                style={{
                  marginLeft: 'auto', fontSize: '0.7rem',
                  background: 'rgba(255,77,106,0.1)', color: '#ff4d6a',
                  padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                }}
              >
                {targetType === 'post' ? 'PUBLICACIÓN' : 'COMENTARIO'}
              </span>
            </div>
          )}

          {/* Moderation note textarea — visible for all staff actions */}
          {isModerating && (
            <div style={{ marginBottom: '4px' }}>
              <label
                style={{
                  fontSize: '0.82rem', marginBottom: '8px', display: 'block',
                  color: 'var(--text)', fontWeight: 600,
                }}
              >
                Mensaje al autor
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (opcional — se enviará como notificación)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  className="input"
                  value={moderationNote}
                  onChange={e => setModerationNote(e.target.value)}
                  placeholder="Ej: Contenido inapropiado, por favor revisa las normas de la comunidad."
                  rows={4}
                  maxLength={300}
                  autoFocus
                  style={{
                    width: '100%', resize: 'vertical', fontSize: '0.88rem',
                    lineHeight: 1.5, padding: '12px 14px',
                    minHeight: '90px',
                  }}
                />
                <div
                  style={{
                    position: 'absolute', bottom: '8px', right: '10px',
                    fontSize: '0.72rem',
                    color: moderationNote.length >= 280 ? '#ff4d6a' : 'var(--text-muted)',
                    fontWeight: moderationNote.length >= 280 ? 600 : 400,
                    background: 'rgba(26,26,46,0.8)', padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {moderationNote.length}/300
                </div>
              </div>

              {/* Quick phrase buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {QUICK_PHRASES.map(phrase => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      const current = moderationNote.trimEnd();
                      const prefix = current ? current + ' ' : '';
                      if ((prefix + phrase).length <= 300) {
                        setModerationNote(prefix + phrase);
                      }
                    }}
                    style={{
                      fontSize: '0.72rem', padding: '4px 10px',
                      borderRadius: '6px', border: '1px solid rgba(255,77,106,0.2)',
                      background: 'rgba(255,77,106,0.06)', color: '#ff4d6a',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(255,77,106,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255,77,106,0.4)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'rgba(255,77,106,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,77,106,0.2)';
                    }}
                  >
                    + {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            padding: '16px 28px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '10px', justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => { onClose(); setModerationNote(''); }}
            disabled={deleting}
            style={{
              padding: '10px 22px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || !targetId}
            style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: deleting
                ? 'linear-gradient(135deg, #cc3d54, #cc1542)'
                : 'linear-gradient(135deg, #ff4d6a, #ff1a4f)',
              color: 'white', cursor: deleting || !targetId ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(255,77,106,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              if (!deleting && targetId) {
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,77,106,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,77,106,0.3)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            {deleting ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'mmSpin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
                </svg>
                Eliminando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                {isModerating ? 'Eliminar y notificar' : 'Eliminar'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes mmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mmZoomIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes mmSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
}
