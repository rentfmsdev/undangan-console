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
 * Resolves a local or remote image URL into a base64 Data URI for Satori / ImageResponse.
 * Satori natively decodes base64 Data URIs without making any network requests,
 * preventing loopback connection failures in Docker/reverse-proxy environments.
 */
export async function resolveShareCardImage(imageUrl: string | undefined): Promise<string | undefined> {
  if (!imageUrl || typeof imageUrl !== "string") return undefined;
  const trimmed = imageUrl.trim();
  if (!trimmed) return undefined;

  // Already a base64 data URI
  if (trimmed.startsWith("data:")) return trimmed;

  // Local file on disk (e.g. /uploads/... or /assets/...)
  if (trimmed.startsWith("/")) {
    try {
      const cleanPath = decodeURIComponent(trimmed.split("?")[0]);
      // Remove leading slash for path.join
      const relativePath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
      const filePath = path.join(process.cwd(), "public", relativePath);
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(cleanPath).replace(".", "");
      const mime = mimeFromExtension(ext);
      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch (err) {
      console.warn(`[resolveShareCardImage] Failed reading local image '${trimmed}':`, err);
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
        return `data:${contentType};base64,${buffer.toString("base64")}`;
      }
    } catch (err) {
      console.warn(`[resolveShareCardImage] Failed fetching remote image '${trimmed}':`, err);
    }
  }

  return trimmed;
}
