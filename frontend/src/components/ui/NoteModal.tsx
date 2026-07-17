'use client';

import { useState, useEffect, useRef } from 'react';

interface NoteModalProps {
  isOpen: boolean;
  currentNote: string;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
}

export default function NoteModal({ isOpen, currentNote, onClose, onSave }: NoteModalProps) {
  const [text, setText] = useState(currentNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = 100;

  useEffect(() => {
    if (isOpen) {
      setText(currentNote);
      setError('');
      // Focus after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, text]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (trimmed.length > maxChars) {
      setError(`Máximo ${maxChars} caracteres`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(trimmed || '');
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const charsLeft = maxChars - text.length;
  const isOverLimit = charsLeft < 0;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 3000,
        animation: 'noteFadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
      }} />

      {/* Modal */}
      <div
        className="glass"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '90%', maxWidth: '440px',
          padding: '32px 28px 24px',
          borderRadius: '20px',
          animation: 'noteScaleIn 0.25s ease',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Top gradient line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--primary), var(--secondary), #00d4ff)',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Pencil icon */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(139,92,246,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Tu Nota</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Comparte cómo te sientes hoy ✨
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe algo sobre ti..."
            maxLength={maxChars + 20}
            rows={3}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border: isOverLimit
                ? '1px solid rgba(239,68,68,0.4)'
                : text
                  ? '1px solid rgba(139,92,246,0.25)'
                  : '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = text
                ? 'rgba(139,92,246,0.25)'
                : 'rgba(255,255,255,0.08)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Character counter + error */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', minHeight: '20px',
        }}>
          {error ? (
            <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 500 }}>
              {error}
            </span>
          ) : (
            <span />
          )}
          <span style={{
            fontSize: '0.78rem',
            fontWeight: isOverLimit ? 700 : 500,
            color: isOverLimit ? '#ef4444' : charsLeft <= 20 ? '#f59e0b' : 'var(--text-muted)',
            transition: 'color 0.2s',
          }}>
            {charsLeft} restantes
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isOverLimit}
            style={{
              flex: 1,
              padding: '12px 20px', borderRadius: '12px',
              border: 'none',
              background: saving
                ? 'rgba(139,92,246,0.5)'
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff', cursor: saving || isOverLimit ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', fontWeight: 700,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: saving || isOverLimit ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!saving && !isOverLimit) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.25)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {saving ? (
              <>
                <span style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                  display: 'inline-block',
                }} />
                Guardando...
              </>
            ) : text.trim() === currentNote.trim() ? (
              'Guardar'
            ) : text.trim() ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Guardar
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Eliminar nota
              </>
            )}
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes noteFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes noteScaleIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
