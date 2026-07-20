import sharp from 'sharp';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import cloudinary from '../lib/cloudinary.js';

const MEDIA_ENGINE_URL = process.env.MEDIA_ENGINE_URL || 'http://localhost:8001';

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

    const res = await fetch(`${MEDIA_ENGINE_URL}/internal/optimize`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody: { detail?: string } = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`Media Engine error (${res.status}): ${errBody.detail}`);
    }

    const data: OptimizeResult = await res.json();
    console.log(
      `🎞️ [MediaEngine] ${folder}: ${((data.original_size_bytes || 0) / 1024).toFixed(1)}KB → ${((data.size_bytes || 0) / 1024).toFixed(1)}KB ` +
      `(${data.animated ? 'animated ' : ''}${data.format})`
    );
    return data;
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

  const maxDimension = folder.includes('logo') ? 512
    : folder.includes('banner') ? 1920
    : maxWidth;

  const compressed = await sharp(buffer)
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  console.log(
    `📦 [Sharp Fallback] ${folder}: ${(buffer.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB`
  );

  const url = await new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `gremio-estelar/${folder}`, resource_type: 'image' },
      (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned no result'));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(compressed);
  });

  return {
    status: 'ok',
    url,
    format: 'webp',
    size_bytes: compressed.length,
    original_size_bytes: buffer.length,
    animated: false,
  };
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
