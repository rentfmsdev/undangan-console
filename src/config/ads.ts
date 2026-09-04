import rawAds from "./ads.json";

export type AdSlot = {
  id: string;
  enabled: boolean;
  title: string;
  description: string;
  badge?: string;
  imageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  isPlaceholder?: boolean;
};

export function getActiveAds(): AdSlot[] {
  return (rawAds as AdSlot[]).filter((ad) => ad.enabled);
}

export function getPrimaryDemoAd(): AdSlot | null {
  const ads = getActiveAds();
  return ads.length > 0 ? ads[0] : null;
}
