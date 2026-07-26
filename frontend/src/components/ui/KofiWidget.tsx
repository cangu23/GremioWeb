'use client';

import React from 'react';

interface KofiWidgetProps {
  kofiId?: string;
  color?: string;
  label?: string;
}

export default function KofiWidget({
  kofiId,
  color = '#72a4f2',
  label = 'Apoyar en Ko-fi ☕',
}: KofiWidgetProps) {
  // Limpiar URL o ID del VTuber (ej: 'https://ko-fi.com/nombre' o 'nombre')
  const cleanId = kofiId ? kofiId.replace(/https?:\/\/(www\.)?ko-fi\.com\//i, '').replace(/\/$/, '') : '';
  const targetUrl = cleanId ? `https://ko-fi.com/${cleanId}` : 'https://ko-fi.com';

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 20px',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, #29abe2, #72a4f2)',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: '0.88rem',
        border: 'none',
        boxShadow: '0 4px 15px rgba(114, 164, 242, 0.4)',
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>☕</span>
      <span>{label}</span>
    </a>
  );
}
