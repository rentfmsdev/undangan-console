import rawStockMusic from "./stock-music.json";

export type StockMusicTrack = {
  id: string;
  title: string;
  artist: string;
  category: string;
  url: string;
  duration: string;
  isDefault?: boolean;
};

export const stockMusicLibrary: StockMusicTrack[] = rawStockMusic as StockMusicTrack[];

export function getStockMusicByUrl(url: string): StockMusicTrack | undefined {
  return stockMusicLibrary.find((track) => track.url === url);
}

export function getDefaultStockMusic(): StockMusicTrack {
  return stockMusicLibrary.find((track) => track.isDefault) ?? stockMusicLibrary[0];
}
