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

const TYPE_LABELS: Record<string, string> = {
  BADGE: 'Insignia',
  COLOR: 'Color',
  BANNER: 'Banner',
  NAME_CHANGE: 'Cambio de Nombre',
  PIN_POST: 'Post Destacado',
  HOVER: 'Efecto',
};

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'BADGE', label: '🏅 Insignias' },
  { key: 'COLOR', label: '🎨 Colores' },
  { key: 'BANNER', label: '🖼️ Banners' },
  { key: 'HOVER', label: '✨ Efectos' },
  { key: 'consumable', label: '📦 Consumibles' },
];

function parseItemData(data: string | null): any {
  try { return data ? JSON.parse(data) : {}; } catch { return {}; }
}

export default function ShopPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [userXp, setUserXp] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    (async () => {
      try {
        const [itemsData, invData, meData] = await Promise.all([
          apiFetch('/shop/items', {}),
          apiFetch('/shop/inventory', {}),
          apiFetch('/gamification/me', {}),
        ]);
        setItems(itemsData || []);
        setInventory(invData || []);
        setUserXp(meData?.xp || 0);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, authLoading, router]);

  const ownedIds = new Set(inventory.map((p) => p.itemId));
  const equippedIds = new Set(inventory.filter((p) => p.equipped).map((p) => p.itemId));

  const filteredItems = items.filter((item) => {
    if (category === 'all') return true;
    if (category === 'consumable') return item.type === 'NAME_CHANGE' || item.type === 'PIN_POST';
    return item.type === category;
  });

  const buyItem = async (itemId: string, price: number) => {
    if (ownedIds.has(itemId)) {
      showToast('Ya tienes este ítem', 'info');
      return;
    }
    if (userXp < price) {
      showToast(`No tienes suficientes puntos. Necesitas ${price} pts.`, 'error');
      return;
    }
    setPurchasing(itemId);
    try {
      const res = await apiFetch(`/shop/buy/${itemId}`, { method: 'POST' });
      setUserXp(res.balance);
      setInventory((prev) => [...prev, res.purchase]);
      showToast(`¡${res.purchase.item.name} comprado!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al comprar', 'error');
    }
    setPurchasing(null);
  };

  const equipItem = async (itemId: string) => {
    try {
      const res = await apiFetch(`/shop/equip/${itemId}`, { method: 'POST' });
      // Refresh inventory
      const invData = await apiFetch('/shop/inventory', {});
      setInventory(invData || []);
      showToast(res.equipped ? 'Ítem equipado' : 'Ítem desequipado', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al equipar', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
            🛒 Tienda
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '16px' }}>
            Gasta tus puntos en ítems exclusivos para tu perfil
          </p>
          <Link
            href="/inventory"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 24px', borderRadius: '12px',
              background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)',
              color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
          >
            🎒 Mi Inventario ({inventory.length})
          </Link>
          <div style={{
            marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '12px 28px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0,230,118,0.08), rgba(138,43,226,0.08))',
            border: '1px solid rgba(0,230,118,0.15)',
          }}>
            <span style={{ fontSize: '1.3rem' }}>💰</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e676' }}>
              {userXp.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Categories filter */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: '32px',
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              style={{
                padding: '8px 18px', borderRadius: '20px', border: 'none',
                background: category === cat.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: category === cat.key ? 'white' : 'var(--text-muted)',
                fontWeight: category === cat.key ? 700 : 500,
                cursor: 'pointer', fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>No hay ítems en esta categoría</p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {filteredItems.map((item) => {
              const owned = ownedIds.has(item.id);
              const equipped = equippedIds.has(item.id);
              const itemData = parseItemData(item.data);
              const isConsumable = item.type === 'NAME_CHANGE' || item.type === 'PIN_POST';
              const canAfford = userXp >= item.price;

              return (
                <div
                  key={item.id}
                  className="glass"
                  style={{
                    padding: '24px', borderRadius: '16px',
                    border: equipped ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(245,158,11,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {TYPE_ICONS[item.type] || '🎁'}
                  </div>

                  {/* Color preview for COLOR type */}
                  {item.type === 'COLOR' && itemData.color && (
                    <div style={{
                      width: '100%', height: '6px', borderRadius: '3px',
                      background: itemData.color,
                      boxShadow: `0 0 12px ${itemData.color}40`,
                    }} />
                  )}

                  {/* Hover effect preview */}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {item.name}
                      </h3>
                      {equipped && (
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px',
                          background: 'var(--primary)', color: 'white',
                          fontSize: '0.65rem', fontWeight: 700,
                        }}>
                          ACTIVO
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      {item.description}
                    </p>
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      padding: '3px 10px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      fontSize: '0.7rem', color: 'var(--text-muted)',
                    }}>
                      {TYPE_LABELS[item.type] || item.type}
                      {isConsumable && itemData.uses && ` · ${itemData.uses} usos`}
                    </span>
                  </div>

                  {/* Price & action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontWeight: 800, fontSize: '1rem',
                      color: canAfford ? '#00e676' : 'var(--warm)',
                    }}>
                      💰 {item.price} pts
                    </div>

                    {owned ? (
                      !isConsumable ? (
                        <button
                          onClick={() => equipItem(item.id)}
                          style={{
                            padding: '8px 18px', borderRadius: '10px', border: equipped ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                            background: equipped ? 'rgba(138,43,226,0.15)' : 'transparent',
                            color: equipped ? 'var(--primary)' : 'var(--text)',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                            transition: 'all 0.2s',
                          }}
                        >
                          {equipped ? '✓ Equipado' : 'Equipar'}
                        </button>
                      ) : (
                        <Link
                          href="/inventory"
                          style={{
                            padding: '8px 18px', borderRadius: '10px',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text)', textDecoration: 'none',
                            fontWeight: 600, fontSize: '0.8rem',
                          }}
                        >
                          Ver en inventario
                        </Link>
                      )
                    ) : (
                      <button
                        onClick={() => buyItem(item.id, item.price)}
                        disabled={purchasing === item.id || !canAfford}
                        style={{
                          padding: '8px 18px', borderRadius: '10px', border: 'none',
                          background: canAfford ? 'linear-gradient(135deg, var(--primary), var(--warm))' : 'rgba(255,255,255,0.05)',
                          color: canAfford ? 'white' : 'var(--text-muted)',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontWeight: 600, fontSize: '0.8rem',
                          transition: 'all 0.2s', opacity: purchasing === item.id ? 0.7 : 1,
                        }}
                      >
                        {purchasing === item.id ? 'Comprando...' : 'Comprar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div style={{ margin: '48px 0', height: '1px', background: 'var(--glass-border)' }} />

        {/* Separator and return */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/inventory" className="btn btn-outline" style={{ padding: '12px 28px', borderRadius: '12px' }}>
            🎒 Ir a mi Inventario
          </Link>
        </div>
      </div>
    </div>
  );
}
