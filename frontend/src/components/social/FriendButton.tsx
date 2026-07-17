'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface FriendButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md';
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'loading';

export default function FriendButton({ targetUserId, size = 'sm' }: FriendButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<FriendStatus>('loading');
  const [actionLoading, setActionLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user) { setStatus('none'); return; }
    if (user.id === targetUserId) { setStatus('none'); return; }
    try {
      // Check friend status — try fetching sent and pending
      const [friendsList, sentReqs, pendingReqs] = await Promise.all([
        apiFetch(`/friends/list/${user.id}`, {}).catch(() => []),
        apiFetch('/friends/sent', {}).catch(() => []),
        apiFetch('/friends/pending', {}).catch(() => []),
      ]);

      // Check if already friends
      if (Array.isArray(friendsList)) {
        const isFriend = friendsList.some((f: any) => f.friendId === targetUserId);
        if (isFriend) { setStatus('friends'); return; }
      }

      // Check sent requests
      if (Array.isArray(sentReqs)) {
        const sent = sentReqs.some((r: any) => r.receiverId === targetUserId);
        if (sent) { setStatus('pending_sent'); return; }
      }

      // Check pending received
      if (Array.isArray(pendingReqs)) {
        const received = pendingReqs.some((r: any) => r.senderId === targetUserId);
        if (received) { setStatus('pending_received'); return; }
      }

      setStatus('none');
    } catch {
      setStatus('none');
    }
  }, [user, targetUserId]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setActionLoading(true);
    try {
      switch (status) {
        case 'none':
          await apiFetch(`/friends/request/${targetUserId}`, { method: 'POST' });
          setStatus('pending_sent');
          break;
        case 'pending_received':
          await apiFetch(`/friends/accept/${targetUserId}`, { method: 'POST' });
          setStatus('friends');
          break;
        case 'pending_sent':
          await apiFetch(`/friends/remove/${targetUserId}`, { method: 'DELETE' });
          setStatus('none');
          break;
        case 'friends':
          await apiFetch(`/friends/remove/${targetUserId}`, { method: 'DELETE' });
          setStatus('none');
          break;
      }
    } catch {
      // Re-check status on error
      checkStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const isSm = size === 'sm';
  const btnStyle: React.CSSProperties = {
    padding: isSm ? '4px 10px' : '8px 18px',
    fontSize: isSm ? '0.75rem' : '0.85rem',
    fontWeight: 700,
    borderRadius: '10px',
    cursor: actionLoading ? 'wait' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    ...(status === 'friends'
      ? { background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }
      : status === 'pending_received'
      ? { background: 'rgba(29,155,240,0.15)', color: '#1d9bf0', border: '1px solid rgba(29,155,240,0.3)' }
      : status === 'pending_sent'
      ? { background: 'rgba(255,152,0,0.15)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)' }
      : { background: 'rgba(139,92,246,0.15)', color: 'var(--primary)', border: '1px solid rgba(139,92,246,0.3)' }
    ),
  };

  if (!user || user.id === targetUserId) return null;
  if (status === 'loading') return null;

  return (
    <button
      onClick={handleAction}
      disabled={actionLoading}
      style={btnStyle}
      onMouseEnter={e => {
        if (status === 'friends') {
          e.currentTarget.style.background = 'rgba(244,67,54,0.15)';
          e.currentTarget.style.borderColor = 'rgba(244,67,54,0.3)';
          e.currentTarget.style.color = '#f44336';
        }
      }}
      onMouseLeave={e => {
        if (status === 'friends') {
          e.currentTarget.style.background = 'rgba(0,230,118,0.15)';
          e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)';
          e.currentTarget.style.color = '#00e676';
        }
      }}
    >
      {actionLoading ? (
        <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
      ) : status === 'friends' ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Amigos
        </>
      ) : status === 'pending_received' ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 12 11 15 16 9"/>
          </svg>
          Aceptar
        </>
      ) : status === 'pending_sent' ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Pendiente
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
          </svg>
          Agregar amigo
        </>
      )}
    </button>
  );
}
