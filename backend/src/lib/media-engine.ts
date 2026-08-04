import sharp from 'sharp';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import cloudinary from '../lib/cloudinary.js';

const MEDIA_ENGINE_URL = process.env.MEDIA_ENGINE_URL || 'http://localhost:8001';

// Shared internal token (optional). When set, it must match the
// MEDIA_ENGINE_TOKEN configured on the media-engine service.
const MEDIA_ENGINE_TOKEN = process.env.MEDIA_ENGINE_TOKEN || '';

export interface OptimizeResult {
  status: 'ok' | 'error';
  url?: string;
  format?: string;
  size_bytes?: number;
  original_size_bytes?: number;
  width?: number;
  height?: number;
  animated?: boolean;
  error?: string;
}

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If Cloudinary returned a relative public path (e.g. "v1785537025/gremio-estelar/pets/...")
  if (trimmed.startsWith('v1') || trimmed.startsWith('v17') || trimmed.startsWith('gremio-estelar/')) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dc10f4n6m';
    return `https://res.cloudinary.com/${cloudName}/image/upload/${trimmed}`;
  }

  // If local uploads relative path
  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  return trimmed;
}

/**
 * Send a buffer to the Python Media Engine for optimization + R2 upload.
 * Falls back to local Sharp processing + Cloudinary if the engine is unreachable.
 */
export async function optimizeImage(
  buffer: Buffer,
  options: {
    folder: string;
    maxWidth?: number;
    quality?: number;
    keepAnimation?: boolean;
  }
): Promise<OptimizeResult> {
  const { folder, maxWidth = 1200, quality = 80, keepAnimation = true } = options;

  try {
    const formData = new FormData();
    // Node.js Blob accepts Uint8Array (Buffer extends Uint8Array)
    const blob = new Blob([buffer as unknown as BlobPart], { type: 'application/octet-stream' });
    formData.append('image', blob, 'upload');
    formData.append('folder', folder);
    formData.append('max_width', String(maxWidth));
    formData.append('quality', String(quality));
    formData.append('keep_animation', String(keepAnimation));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const headers: Record<string, string> = {};
    if (MEDIA_ENGINE_TOKEN) {
      headers['X-Internal-Token'] = MEDIA_ENGINE_TOKEN;
    }

    const res = await fetch(`${MEDIA_ENGINE_URL}/internal/optimize`, {
      method: 'POST',
      body: formData,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody: { detail?: string } = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`Media Engine error (${res.status}): ${errBody.detail}`);
    }

    const data: OptimizeResult = await res.json();
    const normalizedUrl = normalizeMediaUrl(data.url);
    console.log(
      `🎞️ [MediaEngine] ${folder}: ${((data.original_size_bytes || 0) / 1024).toFixed(1)}KB → ${((data.size_bytes || 0) / 1024).toFixed(1)}KB ` +
      `(${data.animated ? 'animated ' : ''}${data.format})`
    );
    return {
      ...data,
      url: normalizedUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`⚠️ [MediaEngine] Engine unreachable, falling back to Sharp: ${message}`);
    return fallbackToSharp(buffer, { folder, maxWidth, quality });
  }
}

/**
 * Fallback: process image with Sharp (Node.js native) and upload to Cloudinary.
 */
async function fallbackToSharp(
  buffer: Buffer,
  options: { folder: string; maxWidth: number; quality: number }
): Promise<OptimizeResult> {
  const { folder, maxWidth, quality } = options;
  const isGif = buffer.length > 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // GIF8

  const maxDimension = folder.includes('logo') ? 512
    : folder.includes('banner') ? 1920
    : maxWidth;

  let compressed: Buffer;
  let format = 'webp';

  if (isGif) {
    try {
      compressed = await sharp(buffer, { animated: true })
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .gif()
        .toBuffer();
      format = 'gif';
    } catch {
      compressed = await sharp(buffer)
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();
    }
  } else {
    compressed = await sharp(buffer)
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
  }

  console.log(
    `📦 [Sharp Fallback] ${folder}: ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB ${isGif ? '(animated GIF)' : '(webp)'}`
  );

  try {
    const rawUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `gremio-estelar/${folder}`,
          resource_type: isGif ? 'auto' : 'image',
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload returned no result'));
          const outUrl = result.secure_url || result.url || result.public_id;
          resolve(outUrl);
        }
      );
      uploadStream.end(compressed);
    });

    const url = normalizeMediaUrl(rawUrl);

    return {
      status: 'ok',
      url,
      format,
      size_bytes: compressed.length,
      original_size_bytes: buffer.length,
      animated: isGif,
    };
  } catch (cloudErr: any) {
    console.warn(`⚠️ [Cloudinary] Failed to upload, saving to local disk: ${cloudErr?.message}`);
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = isGif ? 'gif' : 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, compressed);

    const localUrl = `/uploads/${folder}/${fileName}`;
    return {
      status: 'ok',
      url: localUrl,
      format,
      size_bytes: compressed.length,
      original_size_bytes: buffer.length,
      animated: isGif,
    };
  }
}

/**
 * Check if the Media Engine is healthy.
 */
export async function isEngineHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${MEDIA_ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
