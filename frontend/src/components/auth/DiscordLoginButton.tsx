'use client';

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

/* Official Discord logo (white, fits any background) */
const DiscordLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 71 55"
    fill="#fff"
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44069 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44359 25.4218 0.40141 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9157 10.8048 4.9429 10.7795 4.9793C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.304005 45.5022 0.35682 45.6006 0.440608 45.6719C5.89434 49.7036 11.2519 52.2196 16.5345 53.8909C16.6183 53.9195 16.7117 53.8894 16.7661 53.8174C17.8449 52.2961 18.8002 50.6869 19.631 49.0084C19.6764 48.9251 19.6402 48.8245 19.5528 48.7888C18.0174 48.1556 16.5493 47.3954 15.1345 46.5282C15.0339 46.4661 15.0249 46.3211 15.1161 46.2456C15.4717 45.9626 15.8273 45.6732 16.1703 45.3893C16.214 45.3557 16.2751 45.351 16.3232 45.3779C23.1947 48.5328 30.5879 48.5328 37.3431 45.3779C37.3912 45.3482 37.4523 45.3529 37.4988 45.3865C37.8418 45.6704 38.1974 45.9626 38.553 46.2456C38.6442 46.3239 38.6352 46.4661 38.5346 46.5282C37.1198 47.3954 35.6489 48.1556 34.1107 48.7888C34.0233 48.8245 33.9899 48.9251 34.0353 49.0084C34.869 50.684 35.8242 52.2961 36.9002 53.8145C36.9546 53.8894 37.048 53.9195 37.1318 53.8909C42.4144 52.2196 47.7719 49.7036 53.2256 45.6719C53.3094 45.6006 53.3622 45.5022 53.3728 45.3914C54.8412 30.3496 51.2468 17.0183 60.1868 4.98218C60.1643 4.94578 60.1307 4.91862 60.0915 4.90066ZM23.3735 37.2603C19.9967 37.2603 17.2383 34.2139 17.2383 30.4605C17.2383 26.7071 19.9495 23.6607 23.3735 23.6607C26.8503 23.6607 29.556 26.7604 29.5088 30.4605C29.5088 34.2139 26.7976 37.2603 23.3735 37.2603ZM47.6796 37.2603C44.3028 37.2603 41.5444 34.2139 41.5444 30.4605C41.5444 26.7071 44.2556 23.6607 47.6796 23.6607C51.1564 23.6607 53.8621 26.7604 53.8149 30.4605C53.8149 34.2139 51.1037 37.2603 47.6796 37.2603Z" />
  </svg>
);

const btnBase: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '0.85rem',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '9px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  outline: 'none',
};

export default function DiscordLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleDiscordLogin = () => {
    setLoading(true);
    setError(false);
    // Redirect to Discord OAuth — the callback will redirect back to the app
    window.location.href = `${API_BASE_URL}/auth/discord`;
    // If after 5 seconds we're still here, the redirect probably failed
    setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setError(true);
      }
    }, 5000);
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
      style={{
        ...btnBase,
        border: '1px solid rgba(88, 101, 242, 0.35)',
            background: 'rgba(88, 101, 242, 0.18)',
            color: '#B9C1FF',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(88, 101, 242, 0.2)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(88, 101, 242, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(88, 101, 242, 0.18)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Redirigiendo a Discord...
            </span>
          ) : (
            <>
              <DiscordLogo size={20} />
              Discord
            </>
          )}
        </button>
        <p style={{
          fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0,
        }}>
          ¿No redirige?{' '}
          <button
            onClick={handleDiscordLogin}
            style={{
              background: 'none', border: 'none', color: 'var(--primary)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              textDecoration: 'underline', padding: 0,
            }}
          >
            Intenta de nuevo
          </button>
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleDiscordLogin}
      disabled={loading}
      style={{
        ...btnBase,
        border: '1px solid rgba(232, 199, 122, 0.2)',
        background: loading
          ? 'rgba(88, 101, 242, 0.25)'
          : 'linear-gradient(135deg, rgba(88, 101, 242, 0.22) 0%, rgba(88, 101, 242, 0.12) 100%)',
        color: loading ? 'rgba(255,255,255,0.6)' : '#C9CFFF',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading
          ? 'none'
          : '0 4px 18px rgba(88, 101, 242, 0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 101, 242, 0.34) 0%, rgba(88, 101, 242, 0.2) 100%)';
          e.currentTarget.style.borderColor = 'rgba(129, 140, 255, 0.5)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 8px 26px rgba(88, 101, 242, 0.35), inset 0 1px 0 rgba(255,255,255,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 101, 242, 0.22) 0%, rgba(88, 101, 242, 0.12) 100%)';
          e.currentTarget.style.borderColor = 'rgba(232, 199, 122, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(88, 101, 242, 0.18), inset 0 1px 0 rgba(255,255,255,0.06)';
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.25)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Discord...
        </span>
      ) : (
        <>
          <DiscordLogo size={20} />
          Discord
        </>
      )}
    </button>
  );
}
