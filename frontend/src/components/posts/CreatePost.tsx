'use client';

import { useState, useRef } from 'react';
import { apiFetch, getAccessToken } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/ui/UserAvatar';
import MentionInput from './MentionInput';
import { useSocketMedia } from '@/lib/hooks/useSocketMedia';
import type { CreatePostData } from '../../../../shared/types';

// ==========================================================================
// Types
// ==========================================================================
interface CreatePostProps {
  onPostCreated: (post: CreatePostData) => void;
  onRefreshTrending?: () => void;
  compact?: boolean;
  placeholder?: string;
}

// ==========================================================================
// SVG: Image icon
// ==========================================================================
const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ==========================================================================
// Image upload helper
// ==========================================================================
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato no soportado. Usa JPEG, PNG, WebP o GIF.';
  }
  if (file.size > MAX_SIZE) {
    return 'La imagen es muy grande. Máximo 5 MB.';
  }
  return null;
}

// ==========================================================================
// CreatePost Component
// ==========================================================================
export default function CreatePost({
  onPostCreated,
  onRefreshTrending,
  compact = false,
  placeholder,
}: CreatePostProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mentionIds, setMentionIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndWait } = useSocketMedia();

  const processImageFile = (file: File) => {
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imagePreview) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!user) { router.push('/login'); return; }
    if (imagePreview) {
      setError('Ya tienes una imagen seleccionada. Elimínala primero para arrastrar otra.');
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!content.trim() && !selectedImage) return;

    setPosting(true);
    setError('');

    try {
      let mediaUrl: string | undefined;
      if (selectedImage) {
        setUploadingImage(true);
        setProcessingImage(true);
        try {
          // Non-blocking upload: sends to backend, gets processing ID, waits for media:ready event
          mediaUrl = await uploadAndWait(selectedImage, '/uploads/post');
        } finally {
          setUploadingImage(false);
          setProcessingImage(false);
        }
      }

      const post = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim() || '(imagen)',
          mediaUrl,
          mentions: mentionIds.length > 0 ? mentionIds : undefined,
        }),
      }) as CreatePostData;

      onPostCreated(post);
      setContent('');
      setMentionIds([]);
      removeImage();
      onRefreshTrending?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setPosting(false);
      setUploadingImage(false);
      setProcessingImage(false);
    }
  };

  // Derived user info
  const displayName = user?.vtuberProfile?.displayName || user?.username || '';
  const avatarUrl = user?.vtuberProfile?.avatarUrl || '';

  // Compact mode: avatar next to textarea
  if (compact) {
    return (
      <div className="glass" style={{ padding: '16px' }}>
        {error && (
          <div style={{
            marginBottom: '8px', padding: '8px 12px', borderRadius: '6px',
            background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.82rem',
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <UserAvatar
              src={avatarUrl}
              alt={displayName}
              userId={user?.id}
              size={36}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <MentionInput
                value={content}
                onChange={setContent}
                onMentionsChange={setMentionIds}
                placeholder={placeholder || '¿Qué está pasando, estelar? ✨'}
                maxLength={2000}
                minHeight="48px"
                style={{
                  minHeight: '48px', resize: 'none', fontSize: '0.9rem',
                  border: 'none', background: 'transparent', padding: '8px 4px',
                  color: 'var(--text)', width: '100%',
                }}
              />

              {imagePreview && (
                <div style={{
                  position: 'relative', marginBottom: '8px', borderRadius: '10px',
                  overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <img
                    src={imagePreview} alt=""
                    style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px',
                      borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </div>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px',
              }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                    disabled={posting || !!imagePreview}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      padding: '5px 10px', borderRadius: '6px',
                      cursor: imagePreview ? 'not-allowed' : 'pointer',
                      color: 'var(--text-muted)', fontSize: '0.78rem',
                      transition: 'all 0.2s', opacity: imagePreview ? 0.4 : 1,
                      background: 'none', border: 'none',
                    }}
                    disabled={posting || !!imagePreview}
                    onMouseOver={e => { if (!imagePreview) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseOut={e => { if (!imagePreview) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ImageIcon />
                    Foto
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{content.length}/2000</span>
                </div>
                <button
                  type="submit"
                  className="btn"
                  disabled={(!content.trim() && !selectedImage) || posting || uploadingImage}
                  style={{ padding: '7px 18px', fontSize: '0.82rem' }}
                >
                  {processingImage ? 'Procesando imagen...' : uploadingImage ? 'Subiendo...' : posting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Full mode: standalone card with drag & drop
  return (
    <div className="glass" style={{ padding: '20px', marginBottom: '24px', position: 'relative' }}>
      {error && (
        <div style={{
          padding: '12px', borderRadius: '8px', marginBottom: '16px',
          background: 'rgba(255,77,79,0.1)', color: 'var(--error)', fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ position: 'relative' }}
      >
        {/* Drag & drop overlay */}
        {isDragOver && (
          <div style={{
            position: 'absolute', inset: '-12px', zIndex: 10,
            borderRadius: '16px',
            border: '2px dashed var(--primary)',
            background: 'rgba(139,92,246,0.08)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '8px', pointerEvents: 'none',
            backdropFilter: 'blur(2px)',
            animation: 'fadeInUp 0.2s ease-out',
          }}>
            <UploadIcon />
            <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>Suelta tu imagen aquí</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>JPEG, PNG, WebP o GIF · Máx 5 MB</span>
          </div>
        )}

        <MentionInput
          value={content}
          onChange={setContent}
          onMentionsChange={setMentionIds}
          placeholder={placeholder || (user ? 'Arrastra una imagen o escribe algo... Comparte con la comunidad 📸' : 'Inicia sesión para publicar...')}
          maxLength={2000}
          minHeight="80px"
          style={{
            minHeight: '80px', resize: 'vertical', marginBottom: '12px', fontSize: '0.95rem',
          }}
          disabled={!user}
        />

        {imagePreview && (
          <div style={{
            position: 'relative', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <img
              src={imagePreview} alt="Preview"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }}
            />
            <button
              type="button"
              onClick={removeImage}
              style={{
                position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px',
                borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,77,79,0.8)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
              title="Eliminar imagen"
            >✕</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {user && (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                  disabled={posting || !!imagePreview}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '8px',
                    cursor: imagePreview ? 'not-allowed' : 'pointer',
                    color: imagePreview ? 'var(--text-muted)' : 'var(--text)',
                    fontSize: '0.85rem', transition: 'all 0.2s', opacity: imagePreview ? 0.5 : 1,
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                  }}
                  disabled={posting || !!imagePreview}
                  onMouseOver={e => { if (!imagePreview) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseOut={e => { if (!imagePreview) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <ImageIcon />
                  Imagen
                </button>
              </>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {content.length}/2000 · #hashtags
            </span>
          </div>
          <button
            type="submit"
            className="btn"
            disabled={!user || (!content.trim() && !selectedImage) || posting || uploadingImage}
            style={{ padding: '10px 24px' }}
          >
            {processingImage ? 'Procesando imagen...' : uploadingImage ? 'Subiendo imagen...' : posting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
}
