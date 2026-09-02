import rawStockMusic from "./stock-music.json";

export type StockMusicTrack = {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  category: "wedding" | "birthday" | "khitanan" | "aqiqah" | "general" | string;
  categoryLabel?: string;
  categories?: string[];
  url: string;
  duration: string;
  isDefault?: boolean;
};

export const stockMusicLibrary: StockMusicTrack[] = rawStockMusic as StockMusicTrack[];

export const INVITATION_MUSIC_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "Semua Musik" },
  { id: "wedding", label: "Pernikahan" },
  { id: "birthday", label: "Ulang Tahun" },
  { id: "khitanan", label: "Khitanan" },
  { id: "aqiqah", label: "Aqiqah" },
];

export function normalizeMusicCategory(category?: string): string {
  if (!category) return "wedding";
  const c = category.toLowerCase().trim();
  if (c === "birthday" || c.includes("birth") || c.includes("ulang")) return "birthday";
  if (c === "khitanan" || c.includes("khitan")) return "khitanan";
  if (c === "aqiqah" || c.includes("aqiq")) return "aqiqah";
  if (c === "wedding" || c.includes("nikah") || c.includes("wedding") || c.includes("resepsi")) return "wedding";
  return c;
}

export function getStockMusicByCategory(category?: string): StockMusicTrack[] {
  const norm = normalizeMusicCategory(category);
  return stockMusicLibrary.filter((track) => {
    if (track.category === norm) return true;
    if (track.categories?.includes(norm) || track.categories?.includes("all") || track.categories?.includes("general")) return true;
    return false;
  });
}

export function getStockMusicByUrl(url: string): StockMusicTrack | undefined {
  return stockMusicLibrary.find((track) => track.url === url);
}

export function getDefaultStockMusic(category?: string): StockMusicTrack {
  const norm = normalizeMusicCategory(category);
  const recommended = stockMusicLibrary.filter((track) => {
    if (track.category === norm) return true;
    if (track.categories?.includes(norm)) return true;
    return false;
  });

  const explicitDefault = recommended.find((track) => track.isDefault);
  if (explicitDefault) return explicitDefault;
  if (recommended.length > 0) return recommended[0];
  return stockMusicLibrary.find((track) => track.isDefault) ?? stockMusicLibrary[0];
}
