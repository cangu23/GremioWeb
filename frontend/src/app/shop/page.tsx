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

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'BADGE', label: '🏅 Insignias' },
  { key: 'TITLE', label: '👑 Títulos' },
  { key: 'FRAME', label: '⭕ Marcos' },
  { key: 'COLOR', label: '🎨 Colores' },
  { key: 'BANNER', label: '🖼️ Banners' },
  { key: 'HOVER', label: '✨ Efectos' },
  { key: 'consumable', label: '📦 Consumibles' },
];

function parseItemData(data: string | null): any {
  try { return data ? JSON.parse(data) : {}; } catch { return {}; }
}

// ── Preview Visual Generator for Shop Cards ──
function ItemPreview({ type, data, imageUrl, name }: { type: string; data: any; imageUrl: string | null; name: string }) {
  if (type === 'BADGE') {
    return (
      <div style={{
        height: '70px', borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(138,43,226,0.12), rgba(255,215,0,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>
          {data.icon || '🏅'}
        </span>
        {data.label && (
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: '10px',
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
        height: '70px', borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(20,20,40,0.9), rgba(30,25,60,0.9))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{
          fontSize: '0.9rem', fontWeight: 800,
          background: data.gradient || 'linear-gradient(90deg, #ffd700, #ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          padding: '4px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 0 12px rgba(138,43,226,0.2)',
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
        height: '70px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '50%',
          padding: '3px',
          background: isGradient ? data.gradient : (data.borderColor || '#ffd700'),
          boxShadow: `0 0 16px ${data.glow || 'rgba(255,215,0,0.5)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e1b4b, #31104b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: '#fff',
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
        height: '70px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.3)',
        padding: '12px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '14px', borderRadius: '7px',
          background: data.color || '#ff6b35',
          boxShadow: `0 0 16px ${data.color || '#ff6b35'}60`,
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.72rem', color: 'var(--text-muted)',
        }}>
          <span>Hex: {data.color || '#ff6b35'}</span>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: data.color || '#ff6b35', display: 'inline-block',
          }} />
        </div>
      </div>
    );
  }

  if (type === 'BANNER') {
    const url = data.bannerUrl || imageUrl;
    return (
      <div style={{
        height: '70px', borderRadius: '12px',
        background: url ? `url(${url}) center/cover` : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        border: '1px solid rgba(255,255,255,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }} />
      </div>
    );
  }

  // Fallback for HOVER or Consumables
  return (
    <div style={{
      height: '70px', borderRadius: '12px',
      background: 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,212,255,0.08))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '2rem', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {TYPE_ICONS[type] || '🎁'}
    </div>
  );
}

export default function ShopPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [stardust, setStardust] = useState(0);

  const fetchShopData = async () => {
    try {
      const [itemsData, invData, stardustData] = await Promise.all([
        apiFetch('/shop/items', {}),
        apiFetch('/shop/inventory', {}),
        apiFetch('/ecosystem/stardust/balance', {}),
      ]);
      setItems(itemsData || []);
      setInventory(invData || []);
      setStardust(stardustData?.stardust || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchShopData();
  }, [user, authLoading, router]);

  const ownedIds = new Set(inventory.map((p) => p.itemId));
  const equippedIds = new Set(inventory.filter((p) => p.equipped).map((p) => p.itemId));

  const filteredItems = items.filter((item) => {
    if (category === 'all') return true;
    if (category === 'consumable') return item.type === 'NAME_CHANGE' || item.type === 'PIN_POST';
    return item.type === category;
  });

  const buyItem = async (itemId: string, price: number, name: string) => {
    if (ownedIds.has(itemId)) {
      showToast('Ya tienes este ítem', 'info');
      return;
    }
    if (stardust < price) {
      showToast(`No tienes suficiente Stardust. Necesitas ⭐ ${price}, tienes ⭐ ${stardust}.`, 'error');
      return;
    }
    setPurchasing(itemId);
    try {
      const res = await apiFetch(`/shop/buy/${itemId}`, { method: 'POST' });
      setStardust(res.balance);
      setInventory((prev) => [...prev, res.purchase]);
      showToast(`¡${name} comprado con éxito! ⭐`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al comprar', 'error');
    } finally {
      setPurchasing(null);
    }
  };

  const equipItem = async (itemId: string) => {
    setEquipping(itemId);
    try {
      const res = await apiFetch(`/shop/equip/${itemId}`, { method: 'POST' });
      const invData = await apiFetch('/shop/inventory', {});
      setInventory(invData || []);
      showToast(res.equipped ? 'Ítem equipado en tu perfil ✨' : 'Ítem desequipado', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al equipar', 'error');
    } finally {
      setEquipping(null);
    }
  };

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
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '20px',
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
            fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700,
            marginBottom: '12px',
          }}>
            <span>✨ TIENDA ESTELAR</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '8px' }}>
            Personaliza tu Perfil
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Desbloquea insignias, títulos, marcos y efectos con tus Stardust ⭐
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Balance Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '10px 24px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(138,43,226,0.12))',
              border: '1px solid rgba(255,215,0,0.3)',
              boxShadow: '0 4px 20px rgba(255,215,0,0.1)',
            }}>
              <span style={{ fontSize: '1.4rem' }}>⭐</span>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mi Saldo Stardust</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffd700' }}>
                  {stardust.toLocaleString()} Stardust
                </div>
              </div>
            </div>

            {/* Inventory Link */}
            <Link
              href="/inventory"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 22px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              🎒 Ver Inventario ({inventory.length})
            </Link>
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
                padding: '9px 18px', borderRadius: '20px', border: 'none',
                background: category === cat.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: category === cat.key ? 'white' : 'var(--text-muted)',
                fontWeight: category === cat.key ? 700 : 500,
                cursor: 'pointer', fontSize: '0.85rem',
                transition: 'all 0.2s',
                boxShadow: category === cat.key ? '0 4px 14px rgba(139,92,246,0.3)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>No hay ítems disponibles en esta categoría</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {filteredItems.map((item) => {
              const owned = ownedIds.has(item.id);
              const equipped = equippedIds.has(item.id);
              const itemData = parseItemData(item.data);
              const isConsumable = item.type === 'NAME_CHANGE' || item.type === 'PIN_POST';
              const canAfford = stardust >= item.price;
              const isBusy = purchasing === item.id || equipping === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '20px', borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(28,25,50,0.8), rgba(15,14,30,0.8))',
                    backdropFilter: 'blur(12px)',
                    border: equipped
                      ? '1.5px solid var(--primary)'
                      : owned
                      ? '1px solid rgba(139,92,246,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: equipped
                      ? '0 8px 30px rgba(139,92,246,0.25)'
                      : '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Equipped status top badge */}
                  {equipped && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      padding: '3px 9px', borderRadius: '10px',
                      background: 'var(--primary)', color: 'white',
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}>
                      EQUIPADO
                    </div>
                  )}

                  {/* Visual item preview */}
                  <ItemPreview type={item.type} data={itemData} imageUrl={item.imageUrl} name={item.name} />

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                        {item.name}
                      </h3>
                    </div>

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
                      {isConsumable && itemData.uses && ` · ${itemData.uses} usos`}
                    </span>
                  </div>

                  {/* Price & action footer */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontWeight: 800, fontSize: '1.05rem',
                      color: owned ? 'var(--text-muted)' : canAfford ? '#ffd700' : '#ef4444',
                    }}>
                      <span>⭐</span>
                      <span>{item.price}</span>
                    </div>

                    {owned ? (
                      !isConsumable ? (
                        <button
                          onClick={() => equipItem(item.id)}
                          disabled={isBusy}
                          style={{
                            padding: '8px 16px', borderRadius: '10px',
                            border: equipped ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.15)',
                            background: equipped ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
                            color: equipped ? 'var(--primary)' : '#fff',
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                            transition: 'all 0.2s', opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          {equipping === item.id ? '...' : equipped ? '✓ Equipado' : 'Equipar'}
                        </button>
                      ) : (
                        <Link
                          href="/inventory"
                          style={{
                            padding: '8px 16px', borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#fff', textDecoration: 'none',
                            fontWeight: 700, fontSize: '0.8rem',
                          }}
                        >
                          Usar
                        </Link>
                      )
                    ) : (
                      <button
                        onClick={() => buyItem(item.id, item.price, item.name)}
                        disabled={isBusy || !canAfford}
                        style={{
                          padding: '8px 18px', borderRadius: '10px', border: 'none',
                          background: canAfford
                            ? 'linear-gradient(135deg, var(--primary), #8b5cf6)'
                            : 'rgba(255,255,255,0.08)',
                          color: canAfford ? 'white' : 'var(--text-muted)',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontWeight: 700, fontSize: '0.82rem',
                          transition: 'all 0.2s', opacity: isBusy ? 0.7 : 1,
                          boxShadow: canAfford ? '0 4px 14px rgba(139,92,246,0.3)' : 'none',
                        }}
                      >
                        {purchasing === item.id ? 'Comprando...' : canAfford ? 'Comprar' : 'Sin Stardust'}
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
