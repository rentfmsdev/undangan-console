import fs from "node:fs/promises";
import path from "node:path";

function mimeFromExtension(ext: string): string {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}

/**
 * Satori / resvg ONLY supports PNG and JPEG for raster images.
 * WebP, AVIF, and large raw images cause Satori to crash with fatal errors (`u2 is not iterable`).
 * This helper converts any format to an optimized 1200x630 JPEG data URI.
 */
async function toSatoriCompatibleDataUri(buffer: Buffer, mimeType: string): Promise<string | undefined> {
  const normalized = mimeType.toLowerCase();

  // If already a reasonable PNG or JPEG, check if we need conversion or can convert to optimized JPEG
  try {
    const sharp = (await import("sharp")).default;
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1200, height: 630, fit: "cover", withoutEnlargement: false })
      .jpeg({ quality: 84 })
      .toBuffer();
    return `data:image/jpeg;base64,${optimized.toString("base64")}`;
  } catch (convErr) {
    console.warn("[resolveShareCardImage] Sharp optimization failed, checking fallback:", convErr);
    // If Sharp failed but format is already png or jpeg, return raw
    if (normalized === "image/png" || normalized === "image/jpeg") {
      return `data:${normalized};base64,${buffer.toString("base64")}`;
    }
    // Never pass WebP/AVIF to Satori as it crashes the worker
    return undefined;
  }
}

/**
 * Resolves a local or remote image URL into a Satori-compatible base64 Data URI.
 * Prevents loopback connection failures and WebP crashes in Satori.
 */
export async function resolveShareCardImage(imageUrl: string | undefined): Promise<string | undefined> {
  if (!imageUrl || typeof imageUrl !== "string") return undefined;
  const trimmed = imageUrl.trim();
  if (!trimmed) return undefined;

  // Already a base64 data URI
  if (trimmed.startsWith("data:")) {
    if (trimmed.startsWith("data:image/png") || trimmed.startsWith("data:image/jpeg")) {
      return trimmed;
    }
    // Convert WebP/other data URIs
    try {
      const parts = trimmed.split(",");
      if (parts[1]) {
        const buffer = Buffer.from(parts[1], "base64");
        return await toSatoriCompatibleDataUri(buffer, "image/webp");
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  // Local file on disk (e.g. /uploads/... or /assets/...)
  if (trimmed.startsWith("/")) {
    try {
      const cleanPath = decodeURIComponent(trimmed.split("?")[0]);
      const relativePath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
      const filePath = path.join(process.cwd(), "public", relativePath);
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(cleanPath).replace(".", "");
      const mime = mimeFromExtension(ext);
      return await toSatoriCompatibleDataUri(buffer, mime);
    } catch (err) {
      console.warn(`[resolveShareCardImage] Failed reading local image '${trimmed}':`, err);
      return undefined;
    }
  }

  // Remote HTTP/HTTPS image URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(trimmed, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const buffer = Buffer.from(await response.arrayBuffer());
        return await toSatoriCompatibleDataUri(buffer, contentType);
      }
    } catch (err) {
      console.warn(`[resolveShareCardImage] Failed fetching remote image '${trimmed}':`, err);
    }
    return undefined;
  }

  return undefined;
}

