import fs from "node:fs/promises";
import path from "node:path";

export type ShareCardFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal";
};

let cachedFonts: ShareCardFont[] | null = null;

export async function getShareCardFonts(): Promise<ShareCardFont[]> {
  if (cachedFonts && cachedFonts.length > 0) return cachedFonts;

  const fontDir = path.join(process.cwd(), "src", "modules", "share-card", "fonts");
  const fallbackDir = path.join(process.cwd(), "public", "fonts");

  const fontDefs = [
    { name: "Great Vibes", file: "GreatVibes-Regular.ttf", weight: 400 as const },
    { name: "Dancing Script", file: "DancingScript-SemiBold.ttf", weight: 600 as const },
    { name: "Cormorant Garamond", file: "CormorantGaramond-Regular.ttf", weight: 400 as const },
    { name: "Cormorant Garamond", file: "CormorantGaramond-SemiBold.ttf", weight: 600 as const },
    { name: "Manrope", file: "Manrope-Regular.ttf", weight: 400 as const },
    { name: "Manrope", file: "Manrope-Bold.ttf", weight: 700 as const },
  ];

  const loaded: ShareCardFont[] = [];

  for (const def of fontDefs) {
    try {
      let buf: Buffer;
      try {
        buf = await fs.readFile(path.join(fontDir, def.file));
      } catch {
        buf = await fs.readFile(path.join(fallbackDir, def.file));
      }
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      loaded.push({
        name: def.name,
        data: ab,
        weight: def.weight,
        style: "normal",
      });
    } catch (err) {
      console.warn(`[getShareCardFonts] Failed to load font ${def.file}:`, err);
    }
  }

  cachedFonts = loaded;
  return loaded;
}
