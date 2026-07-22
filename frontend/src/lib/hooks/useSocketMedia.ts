'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket-client';
import { getAccessToken } from '@/lib/api';

export interface MediaReadyPayload {
  id: string;
  url: string;
  format?: string;
  size_bytes?: number;
  original_size_bytes?: number;
  animated?: boolean;
}

export interface MediaErrorPayload {
  id: string;
  error: string;
}

export type MediaStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

export interface MediaUploadState {
  status: MediaStatus;
  url?: string;
  error?: string;
}

type MediaReadyCallback = (data: MediaReadyPayload) => void;
type MediaErrorCallback = (data: MediaErrorPayload) => void;

/**
 * Hook to listen for media:ready and media:error Socket.IO events.
 * 
 * Usage:
 * ```tsx
 * const { waitForMedia } = useSocketMedia();
 * 
 * // Start upload, then wait for result
 * const url = await waitForMedia(uploadId);
 * ```
 */
export function useSocketMedia() {
  const readyListeners = useRef<Map<string, MediaReadyCallback>>(new Map());
  const errorListeners = useRef<Map<string, MediaErrorCallback>>(new Map());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReady = (data: MediaReadyPayload) => {
      const cb = readyListeners.current.get(data.id);
      if (cb) {
        cb(data);
        readyListeners.current.delete(data.id);
        errorListeners.current.delete(data.id);
      }
    };

    const handleError = (data: MediaErrorPayload) => {
      const cb = errorListeners.current.get(data.id);
      if (cb) {
        cb(data);
        readyListeners.current.delete(data.id);
        errorListeners.current.delete(data.id);
      }
    };

    const currentReady = readyListeners.current;
    const currentError = errorListeners.current;

    socket.on('media:ready', handleReady);
    socket.on('media:error', handleError);

    return () => {
      socket.off('media:ready', handleReady);
      socket.off('media:error', handleError);
      currentReady.clear();
      currentError.clear();
    };
  }, []);

  /**
   * Register callbacks for a specific upload ID.
   * Returns a promise that resolves with the URL or rejects with an error.
   */
  const waitForMedia = useCallback((uploadId: string, timeoutMs = 30_000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        readyListeners.current.delete(uploadId);
        errorListeners.current.delete(uploadId);
        reject(new Error('Tiempo de espera agotado al procesar la imagen'));
      }, timeoutMs);

      readyListeners.current.set(uploadId, (data) => {
        clearTimeout(timeout);
        resolve(data.url);
      });

      errorListeners.current.set(uploadId, (data) => {
        clearTimeout(timeout);
        reject(new Error(data.error || 'Error al procesar la imagen'));
      });
    });
  }, []);

  /**
   * Upload an image file to the given endpoint and wait for the media:ready event.
   * Returns the final URL once processed.
   */
  const uploadAndWait = useCallback(async (
    file: File,
    endpoint: string,
    options?: { signal?: AbortSignal }
  ): Promise<string> => {
    const token = getAccessToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error al subir imagen' }));
      throw new Error(err.message || 'Error al subir imagen');
    }

    const data = await res.json();

    // If the response already has a URL (sync processing), return immediately
    if (data.url) return data.url;

    // If it's processing (non-blocking), wait for the Socket.IO event
    if (data.id) {
      return waitForMedia(data.id);
    }

    throw new Error('Respuesta inesperada del servidor');
  }, [waitForMedia]);

  return { waitForMedia, uploadAndWait };
}
