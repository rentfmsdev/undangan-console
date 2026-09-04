/**
 * Utility to get the application base URL and build invitation links.
 * Uses NEXT_PUBLIC_APP_URL from environment variables if available,
 * falling back to window.location.origin in the browser or ROOT_DOMAIN/localhost.
 */

export function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  const rootDomain = process.env.ROOT_DOMAIN;
  if (rootDomain) {
    return `https://${rootDomain}`;
  }

  return "http://localhost:3000";
}

/**
 * Builds the canonical invitation URL for a given slug/identifier and optional guest name.
 * Format: {baseUrl}/i/{slug}?for={encodedGuestName}
 */
export function buildInvitationUrl(slug: string, guestName?: string): string {
  const baseUrl = getAppBaseUrl();
  const cleanSlug = (slug || "ayuardi").replace(/^\/+|\/+$/g, "");
  const path = `/i/${cleanSlug}`;

  if (guestName && guestName.trim()) {
    const encoded = encodeURIComponent(guestName.trim().replace(/\s+/g, " "));
    return `${baseUrl}${path}?for=${encoded}`;
  }

  return `${baseUrl}${path}`;
}
