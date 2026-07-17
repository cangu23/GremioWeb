/**
 * Compress an image file before upload using the browser's Canvas API.
 * - Resizes to fit within maxWidth/maxHeight while preserving aspect ratio
 * - Converts to WebP format for better compression
 * - Returns a smaller Blob ready for upload
 */

interface CompressOptions {
  /** Max width in pixels (default: 1920) */
  maxWidth?: number;
  /** Max height in pixels (default: 1080) */
  maxHeight?: number;
  /** WebP quality 0-1 (default: 0.8) */
  quality?: number;
}

const DEFAULTS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
};

export function compressImage(file: File, options: CompressOptions = {}): Promise<Blob> {
  const opts = { ...DEFAULTS, ...options };

  return new Promise((resolve, reject) => {
    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > opts.maxWidth!) {
          height = Math.round(height * (opts.maxWidth! / width));
          width = opts.maxWidth!;
        }
        if (height > opts.maxHeight!) {
          width = Math.round(width * (opts.maxHeight! / height));
          height = opts.maxHeight!;
        }

        // Draw resized image onto canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback: return original file if canvas context fails
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(
                `📸 [Compress] ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}% reducción)`
              );
              resolve(blob);
            } else {
              // Fallback: return original file
              resolve(file);
            }
          },
          'image/webp',
          opts.quality
        );
      };
      img.onerror = () => {
        // Fallback: return original file if image loading fails
        console.warn('⚠️ [Compress] Failed to load image, uploading original');
        resolve(file);
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      console.warn('⚠️ [Compress] Failed to read file, uploading original');
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}
