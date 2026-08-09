'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import RoleBadge from '@/components/ui/RoleBadge';

interface CustomRoleConfig {
  id: string;
  name: string;
  color: string;
  description: string;
  priority: number;
  isVisible: boolean;
  isVerified: boolean;
  isAutoAssign: boolean;
  isProtected: boolean;
}

const DEFAULT_ROLES: CustomRoleConfig[] = [
  { id: 'OWNER', name: 'Owner / Propietario', color: '#ff0055', description: 'Autoridad suprema de la plataforma', priority: 1, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: true },
  { id: 'ADMIN', name: 'Administrador', color: '#fbbf24', description: 'Gestión total del sistema y saldos', priority: 2, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: true },
  { id: 'STAFF', name: 'Staff de Operaciones', color: '#10b981', description: 'Administración de eventos y comunidad', priority: 3, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: false },
  { id: 'MOD', name: 'Moderador', color: '#fb7185', description: 'Control de contenidos y reportes', priority: 4, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: false },
  { id: 'HELPER', name: 'Helper / Asistente', color: '#34d399', description: 'Soporte a miembros y guía', priority: 5, isVisible: true, isVerified: false, isAutoAssign: false, isProtected: false },
  { id: 'VTUBER', name: 'VTuber / Streamer', color: '#ec4899', description: 'Perfil de creador y alertas live', priority: 6, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: false },
  { id: 'STREAMER', name: 'Streamer', color: '#38bdf8', description: 'Creador de contenido en directo con perfil propio', priority: 7, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: false },
  { id: 'ARTIST', name: 'Artista / Ilustrador', color: '#a78bfa', description: 'Portafolio de arte y comisiones', priority: 8, isVisible: true, isVerified: false, isAutoAssign: false, isProtected: false },
  { id: 'CLIPPER', name: 'Clipper', color: '#fbbf24', description: 'Edits y recortes destacados', priority: 9, isVisible: true, isVerified: false, isAutoAssign: false, isProtected: false },
  { id: 'MAID', name: 'Maid', color: '#c084fc', description: 'Anfitrión del Hoshizora Café', priority: 10, isVisible: true, isVerified: true, isAutoAssign: false, isProtected: false },
  { id: 'USER', name: 'Aventurero Estándar', color: '#a0a0a0', description: 'Miembro registrado común', priority: 11, isVisible: true, isVerified: false, isAutoAssign: true, isProtected: true },
];

export default function RoleBuilderPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<CustomRoleConfig[]>(DEFAULT_ROLES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/admin/settings').then(res => {
      if (res?.settings?.roles_config) {
        try {
          const parsed = JSON.parse(res.settings.roles_config);
          if (Array.isArray(parsed) && parsed.length > 0) setRoles(parsed);
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const handleSaveRoles = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          settings: {
            roles_config: JSON.stringify(roles),
          },
        }),
      });
      showToast('¡Configuración de Roles guardada con éxito! 🎭', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar roles', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = (role: CustomRoleConfig) => {
    const newId = `${role.id}_COPY_${Date.now().toString().slice(-4)}`;
    const copy: CustomRoleConfig = {
      ...role,
      id: newId,
      name: `${role.name} (Copia)`,
      isProtected: false,
    };
    setRoles([...roles, copy]);
    showToast(`Rol duplicado: ${copy.name}`, 'info');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(roles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gremioweb-roles-${Date.now()}.json`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🎭 Constructor Visual de Roles (Role Builder)
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
            Crea, edita, reordena jerarquías, duplica y configura propiedades visuales de cada rol.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 18px', borderRadius: '8px', background: '#1a1a20',
              border: '1px solid #333', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            📥 Exportar JSON
          </button>
          <button
            onClick={handleSaveRoles}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
              border: 'none', color: '#fff', fontWeight: 900, fontSize: '0.85rem',
              cursor: saving ? 'wait' : 'pointer', boxShadow: '0 0 16px rgba(236, 72, 153, 0.4)'
            }}
          >
            {saving ? 'GUARDANDO...' : '💾 GUARDAR ROLES'}
          </button>
        </div>
      </div>

      {/* Role Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {roles.map(r => (
          <div
            key={r.id}
            style={{
              background: '#0d0d12',
              border: `1px solid ${r.color}55`,
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: `0 4px 18px ${r.color}15`,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RoleBadge role={r.id} isVerified={r.isVerified} size="md" />
                <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 800 }}>Prioridad #{r.priority}</span>
              </div>
              <button
                onClick={() => handleDuplicate(r)}
                style={{ background: '#1a1a20', border: '1px solid #333', color: '#a0a0a0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.70rem', cursor: 'pointer' }}
              >
                📋 Duplicar
              </button>
            </div>

            {/* Title & Description */}
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 800 }}>{r.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#a0a0a0' }}>{r.description}</p>
            </div>

            {/* Properties Toggles */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.70rem', fontWeight: 800 }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: r.isVisible ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', color: r.isVisible ? '#34d399' : '#71717a' }}>
                {r.isVisible ? '👁️ Visible' : '🙈 Oculto'}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: r.isVerified ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)', color: r.isVerified ? '#38bdf8' : '#71717a' }}>
                {r.isVerified ? '⭐ Verificado' : 'Normal'}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: r.isAutoAssign ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', color: r.isAutoAssign ? '#fbbf24' : '#71717a' }}>
                {r.isAutoAssign ? '🤖 Automático' : 'Manual'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
