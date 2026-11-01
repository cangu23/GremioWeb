'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface CreatorInfo {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  role: string;
}

interface ValidationResult {
  valid: boolean;
  code?: string;
  bonusPercent?: number;
  message?: string;
  creator?: CreatorInfo;
}

interface CreatorCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onValidationChange?: (result: ValidationResult | null) => void;
  autoValidateInitial?: boolean;
}

export default function CreatorCodeInput({
  value,
  onChange,
  onValidationChange,
  autoValidateInitial = true,
}: CreatorCodeInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<ValidationResult | null>(null);

  const validateCode = useCallback(async (codeToValidate: string) => {
    const cleanCode = codeToValidate.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!cleanCode) {
      setError(null);
      setValidatedData(null);
      if (onValidationChange) onValidationChange(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<ValidationResult>(`/creators/validate?code=${encodeURIComponent(cleanCode)}`);
      if (res && res.valid) {
        setValidatedData(res);
        setError(null);
        if (onValidationChange) onValidationChange(res);
      } else {
        setValidatedData(null);
        setError(res?.message || 'Código no válido o inactivo');
        if (onValidationChange) onValidationChange(null);
      }
    } catch (err: any) {
      setValidatedData(null);
      setError(err?.message || 'Error al verificar el código');
      if (onValidationChange) onValidationChange(null);
    } finally {
      setLoading(false);
    }
  }, [onValidationChange]);

  useEffect(() => {
    if (autoValidateInitial && value && value.trim().length >= 2 && !validatedData) {
      validateCode(value);
    }
  }, [autoValidateInitial, value, validatedData, validateCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uppercase = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    onChange(uppercase);
    if (validatedData) {
      setValidatedData(null);
      if (onValidationChange) onValidationChange(null);
    }
    if (error) setError(null);
  };

  const handleClear = () => {
    onChange('');
    setValidatedData(null);
    setError(null);
    if (onValidationChange) onValidationChange(null);
  };

  return (
    <div style={{ width: '100%' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#e2e8f0',
        marginBottom: '6px',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🏷️</span> Código de Creador (Opcional)
        </span>
        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
          35% apoya al creador
        </span>
      </label>

      {validatedData && validatedData.valid ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {validatedData.creator?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={validatedData.creator.avatar}
                alt={validatedData.creator.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
              }}>
                ✨
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                <span>Apoyando a {validatedData.creator?.name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: '#6ee7b7',
                }}>
                  {validatedData.code}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                ⭐ +10% Polvo Estelar de regalo extra para ti
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.78rem',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            title="Quitar código"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (value.trim()) validateCode(value);
                }
              }}
              placeholder="Ej: LUNA, MAID, VTUBER..."
              maxLength={24}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: error ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                outline: 'none',
              }}
            />
            <button
              type="button"
              disabled={loading || !value.trim()}
              onClick={() => validateCode(value)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: value.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
                color: value.trim() ? '#fff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: value.trim() && !loading ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Verificando...' : 'Aplicar'}
            </button>
          </div>

          {error && (
            <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#f87171' }}>
              ⚠️ {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

