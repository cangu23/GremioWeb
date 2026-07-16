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
  COLOR: '🎨',
  BANNER: '🖼️',
  NAME_CHANGE: '✏️',
  PIN_POST: '📌',
  HOVER: '✨',
};

function parseItemData(data: string | null): any {
  try { return data ? JSON.parse(data) : {}; } catch { return {}; }
}

export default function InventoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [inventory, setInventory] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    (async () => {
      try {
        const data = await apiFetch('/shop/inventory', {});
        setInventory(data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, authLoading, router]);

  const refreshInventory = async () => {
    const data = await apiFetch('/shop/inventory', {});
    setInventory(data || []);
  };

  const equipItem = async (itemId: string) => {
    try {
      await apiFetch(`/shop/equip/${itemId}`, { method: 'POST' });
      await refreshInventory();
      showToast('Ítem actualizado', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error', 'error');
    }
  };

  const consumeItem = async (itemId: string, type: string) => {
    if (type === 'NAME_CHANGE') {
      const newName = prompt('Ingresa tu nuevo nombre de usuario:');
      if (!newName || newName.trim().length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return;
      }
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
      }
      return;
    }

    if (type === 'PIN_POST') {
      showToast('Selecciona un post de tu feed para destacarlo', 'info');
      router.push('/feed');
      return;
    }
  };

  const grouped = inventory.reduce((acc, p) => {
    const type = p.item.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(p);
    return acc;
  }, {} as Record<string, UserPurchase[]>);

  const filteredTypes = Object.entries(grouped).filter(([type]) => {
    if (filter === 'all') return true;
    return type === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
            🎒 Mi Inventario
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '20px' }}>
            {inventory.length} {inventory.length === 1 ? 'ítem comprado' : 'ítems comprados'}
          </p>
          <Link
            href="/shop"
            style={{
              padding: '10px 24px', borderRadius: '12px',
              background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)',
              color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            🛒 Ir a la Tienda
          </Link>
        </div>

        {/* Filter */}
        {inventory.length > 0 && (
          <div style={{
            display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: '32px',
          }}>
            {[
              { key: 'all', label: 'Todo' },
              { key: 'BADGE', label: '🏅 Insignias' },
              { key: 'COLOR', label: '🎨 Colores' },
              { key: 'BANNER', label: '🖼️ Banners' },
              { key: 'HOVER', label: '✨ Efectos' },
              { key: 'NAME_CHANGE', label: '✏️ Nombres' },
              { key: 'PIN_POST', label: '📌 Posts' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '8px 18px', borderRadius: '20px', border: 'none',
                  background: filter === f.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: filter === f.key ? 'white' : 'var(--text-muted)',
                  fontWeight: filter === f.key ? 700 : 500,
                  cursor: 'pointer', fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Inventory items */}
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎒</div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--text)' }}>
              Tu inventario está vacío
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              ¡Visita la tienda para comprar tus primeros ítems!
            </p>
            <Link href="/shop" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', textDecoration: 'none' }}>
              🛒 Ir a la Tienda
            </Link>
          </div>
        ) : (
          filteredTypes.map(([type, purchases]) => (
            <div key={type} style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>{TYPE_ICONS[type] || '🎁'}</span>
                {type === 'BADGE' ? 'Insignias' :
                 type === 'COLOR' ? 'Colores' :
                 type === 'BANNER' ? 'Banners' :
                 type === 'HOVER' ? 'Efectos' :
                 type === 'NAME_CHANGE' ? 'Cambios de Nombre' :
                 type === 'PIN_POST' ? 'Posts Destacados' : type}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({purchases.length})
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {purchases.map((p) => {
                  const itemData = parseItemData(p.item.data);
                  const isConsumable = type === 'NAME_CHANGE' || type === 'PIN_POST';

                  return (
                    <div
                      key={p.id}
                      className="glass"
                      style={{
                        padding: '18px', borderRadius: '14px',
                        border: p.equipped ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                      }}
                    >
                      {/* Color preview */}
                      {type === 'COLOR' && itemData.color && (
                        <div style={{
                          width: '100%', height: '5px', borderRadius: '3px',
                          background: itemData.color,
                          boxShadow: `0 0 10px ${itemData.color}40`,
                        }} />
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{TYPE_ICONS[type] || '🎁'}</span>
                          <strong style={{ fontSize: '0.92rem' }}>{p.item.name}</strong>
                          {p.equipped && (
                            <span style={{
                              padding: '2px 7px', borderRadius: '5px',
                              background: 'var(--primary)', color: 'white',
                              fontSize: '0.6rem', fontWeight: 700, marginLeft: 'auto',
                            }}>
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {p.item.description}
                        </p>
                        {isConsumable && p.remaining !== null && (
                          <span style={{
                            display: 'inline-block', marginTop: '4px',
                            padding: '2px 8px', borderRadius: '5px',
                            background: 'rgba(0,230,118,0.08)',
                            color: '#00e676', fontSize: '0.72rem', fontWeight: 600,
                          }}>
                            {p.remaining} {p.remaining === 1 ? 'uso restante' : 'usos restantes'}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {!isConsumable && (
                          <button
                            onClick={() => equipItem(p.itemId)}
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none',
                              background: p.equipped ? 'rgba(245,158,11,0.1)' : 'rgba(138,43,226,0.1)',
                              color: p.equipped ? 'var(--warm)' : 'var(--primary)',
                              cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                            }}
                          >
                            {p.equipped ? 'Desequipar' : 'Equipar'}
                          </button>
                        )}
                        {isConsumable && p.remaining && p.remaining > 0 && (
                          <button
                            onClick={() => consumeItem(p.itemId, type)}
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none',
                              background: 'linear-gradient(135deg, var(--primary), var(--warm))',
                              color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                            }}
                          >
                            Usar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
