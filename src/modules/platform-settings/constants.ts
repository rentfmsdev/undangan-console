export const PLATFORM_SETTING_KEYS = {
  metaPixelId: "analytics.meta_pixel_id",
} as const;

export function normalizeMetaPixelId(value: unknown) {
  if (typeof value !== "string") return null;
  const pixelId = value.trim();
  return /^\d+$/.test(pixelId) ? pixelId : null;
}
