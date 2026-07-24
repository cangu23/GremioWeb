'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  imageUrl: string | null;
  data: string | null;
}

interface UserPurchase {
  id: string;
  itemId: string;
  equipped: boolean;
  remaining: number | null;
  createdAt: string;
  item: ShopItem;
}

const TYPE_ICONS: Record<string, string> = {
  BADGE: '🏅',
  TITLE: '👑',
  FRAME: '⭕',
  COLOR: '🎨',
  BANNER: '🖼️',
  HOVER: '✨',
  NAME_CHANGE: '✏️',
  PIN_POST: '📌',
};

const TYPE_LABELS: Record<string, string> = {
  BADGE: 'Insignia',
  TITLE: 'Título',
  FRAME: 'Marco Avatar',
  COLOR: 'Color Acento',
  BANNER: 'Banner Perfil',
  HOVER: 'Efecto Hover',
  NAME_CHANGE: 'Cambio de Nombre',
  PIN_POST: 'Post Destacado',
};

function parseItemData(data: string | null): any {
  try { return data ? JSON.parse(data) : {}; } catch { return {}; }
}

function ItemPreview({ type, data, imageUrl, name }: { type: string; data: any; imageUrl: string | null; name: string }) {
  if (type === 'BADGE') {
    return (
      <div style={{
        height: '64px', borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(255,215,0,0.1))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>
          {data.icon || '🏅'}
        </span>
        {data.label && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: '8px',
            background: data.color ? `${data.color}25` : 'rgba(255,215,0,0.2)',
            color: data.color || '#ffd700',
            border: `1px solid ${data.color || '#ffd700'}50`,
          }}>
            {data.label}
          </span>
        )}
      </div>
    );
  }

  if (type === 'TITLE') {
    return (
      <div style={{
        height: '64px', borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(20,20,40,0.9), rgba(30,25,60,0.9))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 12px', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{
          fontSize: '0.85rem', fontWeight: 800,
          background: data.gradient || 'linear-gradient(90deg, #ffd700, #ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          padding: '3px 10px', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {data.text || name}
        </span>
      </div>
    );
  }

  if (type === 'FRAME') {
    const isGradient = !!data.gradient;
    return (
      <div style={{
        height: '64px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%',
          padding: '3px',
          background: isGradient ? data.gradient : (data.borderColor || '#ffd700'),
          boxShadow: `0 0 14px ${data.glow || 'rgba(255,215,0,0.5)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e1b4b, #31104b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', color: '#fff',
          }}>
            👤
          </div>
        </div>
      </div>
    );
  }

  if (type === 'COLOR') {
    return (
      <div style={{
        height: '64px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.3)',
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '12px', borderRadius: '6px',
          background: data.color || '#ff6b35',
          boxShadow: `0 0 12px ${data.color || '#ff6b35'}60`,
        }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Color: {data.color}</span>
      </div>
    );
  }

  if (type === 'BANNER') {
    const url = data.bannerUrl || imageUrl;
    return (
      <div style={{
        height: '64px', borderRadius: '12px',
        background: url ? `url(${url}) center/cover` : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        border: '1px solid rgba(255,255,255,0.15)',
      }} />
    );
  }

  return (
    <div style={{
      height: '64px', borderRadius: '12px',
      background: 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,212,255,0.08))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.8rem', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {TYPE_ICONS[type] || '🎒'}
    </div>
  );
}

export default function InventoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [inventory, setInventory] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);

  const refreshInventory = async () => {
    try {
      const data = await apiFetch('/shop/inventory', {});
      setInventory(data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    refreshInventory();
  }, [user, authLoading, router]);

  const equipItem = async (itemId: string) => {
    setActionId(itemId);
    try {
      const res = await apiFetch(`/shop/equip/${itemId}`, { method: 'POST' });
      await refreshInventory();
      showToast(res.equipped ? 'Ítem equipado ✨' : 'Ítem desequipado', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al equipar', 'error');
    } finally {
      setActionId(null);
    }
  };

  const consumeItem = async (itemId: string, type: string) => {
    if (type === 'NAME_CHANGE') {
      const newName = prompt('Ingresa tu nuevo nombre de usuario:');
      if (!newName || newName.trim().length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return;
      }
      setActionId(itemId);
      try {
        await apiFetch('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ username: newName.trim() }),
        });
        await apiFetch(`/shop/use/${itemId}`, { method: 'POST' });
        await refreshInventory();
        showToast('¡Nombre cambiado exitosamente!', 'success');
      } catch (e: any) {
        showToast(e.message || 'Error al cambiar nombre', 'error');
      } finally {
        setActionId(null);
      }
      return;
    }

    if (type === 'PIN_POST') {
      showToast('Ve a tu perfil para fijar una publicación', 'info');
      return;
    }
  };

  const filteredInventory = inventory.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'equipped') return p.equipped;
    if (filter === 'consumables') return p.item.type === 'NAME_CHANGE' || p.item.type === 'PIN_POST';
    return p.item.type === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '8px' }}>
            🎒 Mi Inventario
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '20px' }}>
            Administra y equipa los ítems que has comprado en la tienda
          </p>

          <Link
            href="/shop"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
              color: 'white', fontWeight: 700, fontSize: '0.88rem',
              textDecoration: 'none', boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
            }}
          >
            🛒 Ir a la Tienda
          </Link>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: '32px',
        }}>
          {[
            { key: 'all', label: `Todos (${inventory.length})` },
            { key: 'equipped', label: `✨ Equipados (${inventory.filter(p => p.equipped).length})` },
            { key: 'FRAME', label: '⭕ Marcos' },
            { key: 'TITLE', label: '👑 Títulos' },
            { key: 'BADGE', label: '🏅 Insignias' },
            { key: 'COLOR', label: '🎨 Colores' },
            { key: 'BANNER', label: '🖼️ Banners' },
            { key: 'consumables', label: '📦 Consumibles' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px', borderRadius: '18px', border: 'none',
                background: filter === f.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: filter === f.key ? 'white' : 'var(--text-muted)',
                fontWeight: filter === f.key ? 700 : 500,
                cursor: 'pointer', fontSize: '0.82rem',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Inventory grid */}
        {filteredInventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>No tienes ítems en esta sección</p>
            <Link href="/shop" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Explorar la Tienda →
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {filteredInventory.map((purchase) => {
              const { item, equipped, remaining } = purchase;
              const itemData = parseItemData(item.data);
              const isConsumable = item.type === 'NAME_CHANGE' || item.type === 'PIN_POST';
              const isBusy = actionId === item.id;

              return (
                <div
                  key={purchase.id}
                  style={{
                    padding: '20px', borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(28,25,50,0.8), rgba(15,14,30,0.8))',
                    backdropFilter: 'blur(12px)',
                    border: equipped
                      ? '1.5px solid var(--primary)'
                      : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: equipped ? '0 8px 30px rgba(139,92,246,0.2)' : 'none',
                  }}
                >
                  {/* Status Tag */}
                  {equipped && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      padding: '3px 9px', borderRadius: '8px',
                      background: 'var(--primary)', color: 'white',
                      fontSize: '0.65rem', fontWeight: 800,
                    }}>
                      EQUIPADO
                    </div>
                  )}

                  {/* Visual preview */}
                  <ItemPreview type={item.type} data={itemData} imageUrl={item.imageUrl} name={item.name} />

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 9px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600,
                    }}>
                      {TYPE_LABELS[item.type] || item.type}
                      {isConsumable && remaining !== null && ` · ${remaining} usos restantes`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {!isConsumable ? (
                      <button
                        onClick={() => equipItem(item.id)}
                        disabled={isBusy}
                        style={{
                          width: '100%', padding: '9px 0', borderRadius: '10px',
                          border: equipped ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.15)',
                          background: equipped ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
                          color: equipped ? 'var(--primary)' : '#fff',
                          cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                          transition: 'all 0.2s', opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        {isBusy ? 'Cargando...' : equipped ? '✓ Desequipar' : 'Equipar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => consumeItem(item.id, item.type)}
                        disabled={isBusy}
                        style={{
                          width: '100%', padding: '9px 0', borderRadius: '10px', border: 'none',
                          background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                          color: 'white', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.85rem',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        {isBusy ? 'Procesando...' : 'Usar ítem'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
