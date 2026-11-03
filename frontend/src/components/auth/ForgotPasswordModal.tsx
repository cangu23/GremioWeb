'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AlertCircle, FourPointStar } from '@/components/ui/Icons';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 18, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '28px 24px',
          borderRadius: '20px',
          background: 'linear-gradient(145deg, rgba(20, 24, 46, 0.95), rgba(12, 14, 28, 0.98))',
          border: '1px solid rgba(138, 43, 226, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(138, 43, 226, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 6px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(0, 229, 255, 0.12)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#00e5ff',
                fontSize: '1.5rem',
              }}
            >
              ✦
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Enlace de Recuperación Enviado
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
              Si el correo <strong>{email}</strong> está registrado en Gremio Estelar, recibirás un mensaje con las instrucciones para restablecer tu contraseña.
            </p>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.76rem',
                color: 'rgba(245, 239, 223, 0.7)',
                lineHeight: 1.5,
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              ✧ Revisa tu bandeja de entrada y la carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>. El enlace expira en 60 minutos.
            </div>
            <button
              onClick={handleClose}
              className="auth-btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Entendido
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#a78bfa',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '6px',
                }}
              >
                <FourPointStar size={12} color="#a78bfa" />
                Seguridad Cósmica
                <FourPointStar size={12} color="#a78bfa" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                ¿Olvidaste tu contraseña?
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '8px', lineHeight: 1.5 }}>
                Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer tu clave.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} color="#FCA5A5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                  }}
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.usuario@ejemplo.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Enviando enlace...
                  </span>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
