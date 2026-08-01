'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

interface PermissionItem {
  id: string;
  name: string;
  category: string;
  description: string;
}

const PERMISSION_CATEGORIES: { category: string; icon: string; items: PermissionItem[] }[] = [
  {
    category: '📰 Feed & Publicaciones',
    icon: '📰',
    items: [
      { id: 'feed_create', name: 'Crear publicaciones', category: 'Feed', description: 'Permite publicar en el Feed principal' },
      { id: 'feed_edit', name: 'Editar publicaciones', category: 'Feed', description: 'Editar texto e imágenes de sus publicaciones' },
      { id: 'feed_delete', name: 'Eliminar publicaciones', category: 'Feed', description: 'Borrar sus propias publicaciones' },
      { id: 'feed_schedule', name: 'Programar publicaciones', category: 'Feed', description: 'Publicación diferida por fecha/hora' },
      { id: 'feed_polls', name: 'Crear encuestas', category: 'Feed', description: 'Adjuntar encuestas votables' },
      { id: 'feed_pin_self', name: 'Fijar post en perfil', category: 'Feed', description: 'Pin de post en perfil propio' },
      { id: 'feed_pin_global', name: 'Fijar post global', category: 'Feed', description: 'Pin de post en cabecera comunitaria' },
      { id: 'feed_upload_gif', name: 'Subir GIFs animados', category: 'Feed', description: 'Permite adjuntar GIFs animadas en posts' },
      { id: 'feed_exclusive', name: 'Posts exclusivos', category: 'Feed', description: 'Contenido exclusivo para seguidores' },
    ],
  },
  {
    category: '💬 Comentarios & Respuestas',
    icon: '💬',
    items: [
      { id: 'comments_create', name: 'Comentar', category: 'Comentarios', description: 'Escribir comentarios en publicaciones' },
      { id: 'comments_reply', name: 'Responder comentarios', category: 'Comentarios', description: 'Crear hilos de respuesta' },
      { id: 'comments_pin', name: 'Fijar comentarios', category: 'Comentarios', description: 'Fijar comentario al inicio del hilo' },
      { id: 'comments_delete', name: 'Eliminar comentarios', category: 'Comentarios', description: 'Borrar comentarios ajenos e inapropiados' },
      { id: 'comments_moderate', name: 'Moderar hilos', category: 'Comentarios', description: 'Cerrar o pausar comentarios en posts' },
    ],
  },
  {
    category: '💰 Economía & Comercio',
    icon: '💰',
    items: [
      { id: 'economy_grant_stardust', name: 'Otorgar Stardust 👑', category: 'Economía', description: 'Crear/Regalar Stardust a cualquier usuario' },
      { id: 'economy_transfer', name: 'Transferir Stardust', category: 'Economía', description: 'Enviar Stardust entre usuarios' },
      { id: 'economy_gift_plan', name: 'Regalar Plan Premium', category: 'Economía', description: 'Regalar membresía Astro/Nova/Stellar' },
      { id: 'economy_giveaway', name: 'Crear Sorteos', category: 'Economía', description: 'Crear sorteos automáticos de Stardust' },
      { id: 'economy_marketplace', name: 'Intercambiar Cosméticos', category: 'Economía', description: 'Comerciar marcos e ítems entre miembros' },
    ],
  },
  {
    category: '🎨 Perfil & Personalización',
    icon: '🎨',
    items: [
      { id: 'profile_custom_url', name: 'URL personalizada', category: 'Perfil', description: 'Enlace personalizado gremioestelar.com/u/alias' },
      { id: 'profile_neon_notes', name: 'Notas neón custom', category: 'Perfil', description: 'Glow neón y color personalizado en notas' },
      { id: 'profile_banner_video', name: 'Banner en vídeo', category: 'Perfil', description: 'Subir vídeo animado .mp4/.webm como portada' },
      { id: 'profile_custom_pet', name: 'Solicitud de Mascota', category: 'Perfil', description: 'Solicitar GIF de mascota personalizada' },
    ],
  },
  {
    category: '🎪 Gremios & Eventos',
    icon: '🎪',
    items: [
      { id: 'guilds_create', name: 'Fundar Gremios', category: 'Gremios', description: 'Crear y liderar un nuevo Gremio' },
      { id: 'guilds_subgroups', name: 'Crear Subgrupos', category: 'Gremios', description: 'Canales y sub-rangos internos en gremio' },
      { id: 'events_create_official', name: 'Crear Eventos Oficiales', category: 'Eventos', description: 'Publicar eventos en el calendario público' },
      { id: 'events_feature', name: 'Destacar Eventos', category: 'Eventos', description: 'Poner eventos en la portada principal' },
    ],
  },
  {
    category: '🔴 Creadores & Live Monitor',
    icon: '🔴',
    items: [
      { id: 'creator_live_badge', name: 'Alerta Live 🔴', category: 'Creadores', description: 'Banner de en vivo automático al transmitir' },
      { id: 'creator_tips', name: 'Recibir Donaciones 💖', category: 'Creadores', description: 'Habilitar botón de propinas de Stardust' },
      { id: 'creator_goals', name: 'Objetivos de Donación', category: 'Creadores', description: 'Barras de meta de donaciones en perfil' },
      { id: 'creator_clips', name: 'Publicar Clips', category: 'Creadores', description: 'Pestaña de vídeos cortos y destacados' },
    ],
  },
  {
    category: '🛡️ Moderación & Seguridad',
    icon: '🛡️',
    items: [
      { id: 'mod_reports', name: 'Revisar Reportes', category: 'Moderación', description: 'Acceso a la bandeja de reportes de usuarios' },
      { id: 'mod_slowmode', name: 'Modo Lento (Cooldown)', category: 'Moderación', description: 'Activar cooldown de envío en chats' },
      { id: 'mod_timeout', name: 'Timeout / Silenciar', category: 'Moderación', description: 'Silenciar usuarios temporalmente' },
      { id: 'mod_ban', name: 'Ban / Expulsar', category: 'Moderación', description: 'Banear usuarios del sistema' },
      { id: 'mod_shadowban', name: 'Shadowban', category: 'Moderación', description: 'Ocultar contenido sin notificar al usuario' },
      { id: 'mod_view_ip', name: 'Ver IP / Dispositivos 👑', category: 'Moderación', description: 'Inspeccionar IP y sesiones (Solo Admin/Owner)' },
    ],
  },
];

const MATRIX_COLUMNS = [
  { id: 'USER', label: 'USER', color: '#a0a0a0' },
  { id: 'VTUBER', label: 'VTUBER', color: '#ec4899' },
  { id: 'ARTIST', label: 'ARTIST', color: '#a78bfa' },
  { id: 'CLIPPER', label: 'CLIPPER', color: '#fbbf24' },
  { id: 'MAID', label: 'MAID', color: '#c084fc' },
  { id: 'ASTRO', label: 'ASTRO', color: '#818cf8' },
  { id: 'NOVA', label: 'NOVA', color: '#38bdf8' },
  { id: 'STELLAR', label: 'STELLAR', color: '#ffd700' },
  { id: 'HELPER', label: 'HELPER', color: '#34d399' },
  { id: 'MOD', label: 'MOD', color: '#fb7185' },
  { id: 'STAFF', label: 'STAFF', color: '#10b981' },
  { id: 'ADMIN', label: 'ADMIN', color: '#fbbf24' },
  { id: 'OWNER', label: 'OWNER', color: '#ff0055' },
];

type StateValue = 'ON' | 'OFF' | 'HEREDADO' | 'DENEGADO';

export default function PermissionMatrixPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');
  const [saving, setSaving] = useState(false);
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, StateValue>>>({});

  useEffect(() => {
    apiFetch('/admin/settings').then(res => {
      if (res?.settings?.permission_matrix) {
        try {
          const parsed = JSON.parse(res.settings.permission_matrix);
          setMatrixState(parsed);
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const getCellValue = (permId: string, colId: string): StateValue => {
    if (colId === 'OWNER' || colId === 'ADMIN') return 'ON';
    return matrixState[permId]?.[colId] || (colId === 'USER' ? 'OFF' : 'HEREDADO');
  };

  const toggleCell = (permId: string, colId: string) => {
    if (colId === 'OWNER' || colId === 'ADMIN') return;
    const current = getCellValue(permId, colId);
    const cycle: Record<StateValue, StateValue> = {
      ON: 'OFF',
      OFF: 'HEREDADO',
      HEREDADO: 'DENEGADO',
      DENEGADO: 'ON',
    };
    const next = cycle[current];

    setMatrixState(prev => ({
      ...prev,
      [permId]: {
        ...(prev[permId] || {}),
        [colId]: next,
      },
    }));
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          settings: {
            permission_matrix: JSON.stringify(matrixState),
          },
        }),
      });
      showToast('¡Matriz de Permisos guardada con éxito! 🛡️', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al guardar matriz', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            📊 Matriz Granular de Permisos (Spreadsheet Matrix)
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a0a0a0', margin: '4px 0 0' }}>
            Controla visualmente los interruptores de cada función por Rol Base, Plan y Cargo Staff sin tocar código.
          </p>
        </div>

        <button
          onClick={handleSaveMatrix}
          disabled={saving}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00e5ff, #00b0ff)',
            border: 'none',
            color: '#000',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 0 16px rgba(0, 229, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {saving ? 'GUARDANDO MATRIZ...' : '💾 GUARDAR MATRIZ DE PERMISOS'}
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#0d0d12', padding: '14px', borderRadius: '8px', border: '1px solid #1a1a20' }}>
        <input
          type="text"
          placeholder="🔍 Buscar permiso por nombre o ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px', padding: '8px 14px', background: '#050505',
            border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none'
          }}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '8px 14px', background: '#050505',
            border: '1px solid #262626', color: '#fff', fontSize: '0.85rem', borderRadius: '6px', outline: 'none'
          }}
        >
          <option value="ALL">Todas las Categorías</option>
          {PERMISSION_CATEGORIES.map(c => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </select>
      </div>

      {/* Legend Bar */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', fontWeight: 700, background: '#08080c', padding: '10px 16px', borderRadius: '6px', border: '1px solid #1a1a20' }}>
        <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#34d399' }} /> ON (Permitido)
        </span>
        <span style={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3f3f46' }} /> OFF (Apagado)
        </span>
        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#38bdf8' }} /> HEREDADO (De Rol/Plan)
        </span>
        <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f87171' }} /> DENEGADO (Bloqueado)
        </span>
      </div>

      {/* Interactive Matrix Spreadsheet */}
      <div style={{ overflowX: 'auto', background: '#0d0d12', border: '1px solid #1a1a20', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#fff' }}>
          <thead>
            <tr style={{ background: '#050505', borderBottom: '2px solid #1a1a20' }}>
              <th style={{ textAlign: 'left', padding: '14px 16px', minWidth: '260px', position: 'sticky', left: 0, background: '#050505', zIndex: 2 }}>
                Nodos de Permiso
              </th>
              {MATRIX_COLUMNS.map(col => (
                <th key={col.id} style={{ padding: '12px 10px', textAlign: 'center', color: col.color, fontWeight: 900, minWidth: '85px' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_CATEGORIES.map(cat => {
              if (filterCat !== 'ALL' && filterCat !== cat.category) return null;
              const filteredItems = cat.items.filter(item =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.id.toLowerCase().includes(search.toLowerCase())
              );
              if (filteredItems.length === 0) return null;

              return (
                <React.Fragment key={cat.category}>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid #262626', borderBottom: '1px solid #262626' }}>
                    <td colSpan={MATRIX_COLUMNS.length + 1} style={{ padding: '10px 16px', fontWeight: 800, color: '#fbbf24', fontSize: '0.85rem' }}>
                      {cat.icon} {cat.category}
                    </td>
                  </tr>
                  {filteredItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1a1a20', transition: 'background 0.15s' }}>
                      <td style={{ padding: '10px 16px', position: 'sticky', left: 0, background: '#0d0d12', zIndex: 1, borderRight: '1px solid #1a1a20' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '0.70rem', color: '#71717a', marginTop: '2px' }}>{item.description}</div>
                      </td>
                      {MATRIX_COLUMNS.map(col => {
                        const val = getCellValue(item.id, col.id);
                        const styleMap: Record<StateValue, { bg: string; color: string; border: string }> = {
                          ON: { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
                          OFF: { bg: 'rgba(255, 255, 255, 0.04)', color: '#71717a', border: 'rgba(255, 255, 255, 0.08)' },
                          HEREDADO: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' },
                          DENEGADO: { bg: 'rgba(244, 63, 94, 0.18)', color: '#f87171', border: 'rgba(244, 63, 94, 0.4)' },
                        };
                        const cellStyle = styleMap[val];

                        return (
                          <td key={col.id} style={{ padding: '8px', textAlign: 'center' }}>
                            <button
                              onClick={() => toggleCell(item.id, col.id)}
                              disabled={col.id === 'OWNER' || col.id === 'ADMIN'}
                              style={{
                                width: '100%',
                                padding: '6px 4px',
                                borderRadius: '6px',
                                background: cellStyle.bg,
                                border: `1px solid ${cellStyle.border}`,
                                color: cellStyle.color,
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                cursor: (col.id === 'OWNER' || col.id === 'ADMIN') ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {val}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
