/**
 * Client-Side Image Compression Utility
 * Resizes high-resolution photos (e.g. 5MB-15MB from smartphones)
 * and encodes them to efficient WebP (< 500KB) in the browser before upload.
 */

export type CompressOptions = {
  maxDimension?: number;
  quality?: number;
  outputType?: "image/webp" | "image/jpeg";
};

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxDimension = 1920,
    quality = 0.82,
    outputType = "image/webp",
  } = options;

  // Only compress raster images; skip SVGs, GIFs (preserve animation), audio, etc.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  // If running in an environment without DOM/Canvas support (SSR), return file as is
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file).catch(async () => {
      // Fallback using HTMLImageElement for older browsers/codecs
      return new Promise<ImageBitmap>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          createImageBitmap(img).then(resolve).catch(reject);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Gagal membaca file gambar."));
        };
        img.src = url;
      });
    });

    let { width, height } = bitmap;

    // Calculate proportional downscaling
    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    // Render to canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // Export to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob) {
      return file;
    }

    // Only use compressed blob if it actually reduced the file size
    if (blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const extension = outputType === "image/webp" ? "webp" : "jpg";
    const compressedName = `${baseName}.${extension}`;

    return new File([blob], compressedName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("[ImageCompressor] Kompresi gagal, menggunakan file asli:", error);
    return file;
  }
}
