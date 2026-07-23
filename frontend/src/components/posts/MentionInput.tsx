'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

// ==========================================================================
// Types
// ==========================================================================
interface MentionUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  vtuberProfile?: {
    displayName: string;
    avatarUrl: string | null;
    isVerified?: boolean;
    isApproved?: boolean;
  } | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (userIds: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

// ==========================================================================
// MentionInput Component
// ==========================================================================
export default function MentionInput({
  value,
  onChange,
  onMentionsChange,
  placeholder,
  maxLength = 2000,
  minHeight = '70px',
  className,
  style,
  disabled = false,
}: MentionInputProps) {
  const [mentionSearch, setMentionSearch] = useState('');  // Text after @
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);  // Cursor pos when @ was typed
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Track all mentioned user IDs
  const mentionedIdsRef = useRef<Set<string>>(new Set());

  // Search users as user types after @
  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) {
      setMentionResults([]);
      setShowMentions(false);
      return;
    }
    try {
      const data = await apiFetch(`/users/search/mentions?q=${encodeURIComponent(query)}`, {});
      setMentionResults(data || []);
      setShowMentions((data?.length || 0) > 0);
      setSelectedIndex(0);
    } catch {
      setMentionResults([]);
      setShowMentions(false);
    }
  }, []);

  // Handle text input — detect @ character
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);

    onChange(newValue);

    // Look backwards from cursor to find @trigger
    const textBefore = newValue.slice(0, pos);
    const atIndex = textBefore.lastIndexOf('@');
    if (atIndex !== -1) {
      // Check there's no space before @ (or it's at the start)
      const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || charBefore === '\t') {
        const afterAt = textBefore.slice(atIndex + 1);
        // Only trigger if it's alphanumeric (no spaces)
        if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
          setMentionSearch(afterAt);
          setMentionStart(atIndex);
          if (searchTimeout.current) clearTimeout(searchTimeout.current);
          searchTimeout.current = setTimeout(() => searchMentions(afterAt), 150);
          return;
        }
      }
    }

    // No active @mention
    setShowMentions(false);
    setMentionStart(-1);
    setMentionSearch('');
  };

  // Handle cursor position change
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const pos = (e.target as HTMLTextAreaElement).selectionStart || 0;
    setCursorPos(pos);

    // Check if cursor moved past @
    if (mentionStart !== -1 && (pos < mentionStart || pos > mentionStart + mentionSearch.length + 1)) {
      setShowMentions(false);
      setMentionStart(-1);
    }
  };

  // Insert selected mention
  const insertMention = (user: MentionUser) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBefore = value.slice(0, mentionStart);
    const textAfter = value.slice(mentionStart + 1 + mentionSearch.length);
    const mentionText = `@${user.username} `;
    const newValue = textBefore + mentionText + textAfter;

    onChange(newValue);

    // Track mentioned user
    mentionedIdsRef.current.add(user.id);
    onMentionsChange(Array.from(mentionedIdsRef.current));

    // Set cursor position after the mention
    const newCursorPos = mentionStart + mentionText.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });

    setShowMentions(false);
    setMentionStart(-1);
    setMentionSearch('');
  };

  // Keyboard navigation for mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % mentionResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedIndex >= 0 && selectedIndex < mentionResults.length) {
        e.preventDefault();
        insertMention(mentionResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      setMentionStart(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMentions) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMentions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMentions]);

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight,
    fontSize: '0.9rem',
    lineHeight: 1.5,
    padding: '10px 12px',
    resize: 'vertical',
    ...style,
  };

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        className={className || 'input'}
        style={textareaStyle}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        disabled={disabled}
      />

      {/* @mention autocomplete dropdown */}
      {showMentions && mentionResults.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            maxHeight: '220px',
            overflowY: 'auto',
            marginBottom: '4px',
            animation: 'fadeInUp 0.12s ease-out',
          }}
        >
          <div style={{
            padding: '4px 10px 6px',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            Menciones
            <span style={{ marginLeft: '8px', fontWeight: 400, opacity: 0.6 }}>
              @{mentionSearch}
            </span>
          </div>
          {mentionResults.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 10px',
                border: 'none',
                background: idx === selectedIndex ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                borderRadius: '8px',
                transition: 'background 0.1s',
                textAlign: 'left',
              }}
            >
              {/* Avatar mini */}
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                flexShrink: 0,
                background: (user.avatarUrl || user.vtuberProfile?.avatarUrl)
                  ? `url(${user.avatarUrl || user.vtuberProfile?.avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                overflow: 'hidden',
              }}>
                {!(user.avatarUrl || user.vtuberProfile?.avatarUrl) && (user.displayName || user.vtuberProfile?.displayName || user.username).charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 600 }}>
                  {user.displayName || user.vtuberProfile?.displayName || user.username}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
                  @{user.username}
                </span>
              </div>
              {(user.role === 'VTUBER' || user.vtuberProfile?.isApproved) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="VTuber Oficial">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
            </button>
          ))}
          <div style={{
            padding: '6px 10px 2px',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            ↑↓ Navegar · Enter seleccionar · Esc cerrar
          </div>
        </div>
      )}

      {/* Mention badge counter */}
      {mentionedIdsRef.current.size > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          fontSize: '0.7rem',
          color: 'var(--primary)',
          background: 'rgba(139,92,246,0.1)',
          padding: '2px 8px',
          borderRadius: '10px',
          pointerEvents: 'none',
        }}>
          @{mentionedIdsRef.current.size}
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// Helper: Extract @mentions from text for rendering
// ==========================================================================
export function renderContentWithMentions(
  text: string,
  hashtagLink?: string,
  mentionLinkPrefix?: string,
) {
  // Split by both hashtags and @mentions
  const parts = text.split(/(#\w+|@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link key={i} href={hashtagLink ? `${hashtagLink}${tag}` : `/feed?tag=${tag}`}
          style={{ color: 'var(--primary)', fontWeight: 500 }}>
          {part}
        </Link>
      );
    }
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link key={i} href={mentionLinkPrefix ? `${mentionLinkPrefix}${username}` : `/vtubers?q=${encodeURIComponent(username)}`}
          style={{ color: 'var(--secondary)', fontWeight: 500 }}>
          {part}
        </Link>
      );
    }
    return part;
  });
}

// ==========================================================================
// Helper: extract mentioned usernames from text
// NOTE: The MentionInput component uses a callback-based approach (onMentionsChange)
// to track user IDs directly. This helper is kept for potential server-side
// extraction or for cases where raw text analysis is needed.
// ==========================================================================
export function extractMentionUsernames(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1)); // Remove @
}
