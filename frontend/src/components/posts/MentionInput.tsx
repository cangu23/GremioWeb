'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import UserAvatar from '@/components/ui/UserAvatar';
import { hasAnyRole } from '@gremio-estelar/shared';

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
  streamerProfile?: {
    displayName: string;
    avatarUrl: string | null;
    isVerified?: boolean;
    isApproved?: boolean;
  } | null;
}

interface HashtagItem {
  id?: string;
  name: string;
  _count?: { posts: number };
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
  const [mentionSearch, setMentionSearch] = useState('');  // Text after trigger (@ or #)
  const [triggerType, setTriggerType] = useState<'mention' | 'hashtag' | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [hashtagResults, setHashtagResults] = useState<HashtagItem[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);  // Cursor pos when trigger was typed
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
      setTriggerType('mention');
      setShowMentions((data?.length || 0) > 0);
      setSelectedIndex(0);
    } catch {
      setMentionResults([]);
      setShowMentions(false);
    }
  }, []);

  // Search hashtags as user types after #
  const searchHashtags = useCallback(async (query: string) => {
    try {
      const data = await apiFetch(`/posts/hashtags/search?q=${encodeURIComponent(query)}&limit=6`, {});
      setHashtagResults(data || []);
      setTriggerType('hashtag');
      setShowMentions((data?.length || 0) > 0);
      setSelectedIndex(0);
    } catch {
      setHashtagResults([]);
      setShowMentions(false);
    }
  }, []);

  // Handle text input — detect @ (mentions) or # (hashtags)
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);

    onChange(newValue);

    // Look backwards from cursor to find closest trigger (@ or #)
    const textBefore = newValue.slice(0, pos);
    const atIndex = textBefore.lastIndexOf('@');
    const hashIndex = textBefore.lastIndexOf('#');

    const lastTriggerIndex = Math.max(atIndex, hashIndex);
    if (lastTriggerIndex !== -1) {
      const isHash = lastTriggerIndex === hashIndex;
      const charBefore = lastTriggerIndex > 0 ? textBefore[lastTriggerIndex - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || charBefore === '\t') {
        const query = textBefore.slice(lastTriggerIndex + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionSearch(query);
          setMentionStart(lastTriggerIndex);
          if (searchTimeout.current) clearTimeout(searchTimeout.current);
          if (isHash) {
            searchTimeout.current = setTimeout(() => searchHashtags(query), 150);
          } else {
            searchTimeout.current = setTimeout(() => searchMentions(query), 150);
          }
          return;
        }
      }
    }

    // No active trigger
    setShowMentions(false);
    setTriggerType(null);
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
    setTriggerType(null);
    setMentionStart(-1);
    setMentionSearch('');
  };

  // Insert selected hashtag
  const insertHashtag = (tag: HashtagItem) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBefore = value.slice(0, mentionStart);
    const textAfter = value.slice(mentionStart + 1 + mentionSearch.length);
    const hashtagText = `#${tag.name} `;
    const newValue = textBefore + hashtagText + textAfter;

    onChange(newValue);

    const newCursorPos = mentionStart + hashtagText.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });

    setShowMentions(false);
    setTriggerType(null);
    setMentionStart(-1);
    setMentionSearch('');
  };

  // Keyboard navigation for autocomplete dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;

    const listLength = triggerType === 'hashtag' ? hashtagResults.length : mentionResults.length;
    if (listLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % listLength);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + listLength) % listLength);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedIndex >= 0 && selectedIndex < listLength) {
        e.preventDefault();
        if (triggerType === 'hashtag') {
          insertHashtag(hashtagResults[selectedIndex]);
        } else {
          insertMention(mentionResults[selectedIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      setTriggerType(null);
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

      {/* Autocomplete dropdown (Mentions & Hashtags) */}
      {showMentions && (
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
          {triggerType === 'hashtag' ? (
            <>
              <div style={{
                padding: '4px 10px 6px',
                fontSize: '0.65rem',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>✦</span>
                <span>Hashtags y Tendencias</span>
                <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.6 }}>
                  #{mentionSearch}
                </span>
              </div>
              {hashtagResults.map((tag, idx) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => insertHashtag(tag)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    background: idx === selectedIndex ? 'rgba(139,92,246,0.18)' : 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    transition: 'background 0.1s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#c084fc' }}>
                    #{tag.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {tag._count?.posts || 0} {(tag._count?.posts || 0) === 1 ? 'publicación' : 'publicaciones'}
                  </span>
                </button>
              ))}
            </>
          ) : (
            <>
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
              {mentionResults.map((user, idx) => {
                const isVtuber = hasAnyRole(user.role, ['VTUBER']) || !!user.vtuberProfile?.isApproved;
                const isStreamer = hasAnyRole(user.role, ['STREAMER']) || !!user.streamerProfile?.isApproved;
                return (
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
                    <UserAvatar
                      src={user.avatarUrl || user.vtuberProfile?.avatarUrl || user.streamerProfile?.avatarUrl}
                      alt={user.username}
                      size={26}
                      user={user}
                      userId={user.id}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>
                        {user.displayName || user.vtuberProfile?.displayName || user.streamerProfile?.displayName || user.username}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
                        @{user.username}
                      </span>
                    </div>
                    {isVtuber && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#8B5CF6" stroke="none" aria-label="VTuber Verificada">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                    {isStreamer && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#22D3EE" stroke="none" aria-label="Streamer Verificado">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </>
          )}
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

import { renderFormattedContent, useStickersCache } from '@/lib/content-renderer';

// ==========================================================================
// Helper: Extract @mentions, hashtags, emojis & stickers from text
// ==========================================================================
export function renderContentWithMentions(
  text: string,
  hashtagLink?: string,
  mentionLinkPrefix?: string,
) {
  return renderFormattedContent(text, { hashtagLink, mentionLinkPrefix });
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
