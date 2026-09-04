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
  const cleanSlug = (slug || "").replace(/^\/+|\/+$/g, "");
  const path = cleanSlug ? `/i/${cleanSlug}` : "";

  if (guestName && guestName.trim()) {
    const encoded = encodeURIComponent(guestName.trim().replace(/\s+/g, " "));
    return `${baseUrl}${path}?for=${encoded}`;
  }

  return `${baseUrl}${path}`;
}

export function getRootDomain(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || /^[0-9.]+$/.test(host)) {
      return host;
    }
    const parts = host.split(".");
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }
    return host;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (appUrl) {
    try {
      const u = new URL(appUrl);
      const host = u.hostname.toLowerCase().replace(/^www\./, "");
      if (host) return host;
    } catch {
      // ignore
    }
  }

  const envDomain = process.env.ROOT_DOMAIN;
  if (envDomain && envDomain !== "undangan.co") {
    return envDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/:\d+$/, "");
  }

  return "undang.site";
}

/**
 * Builds a subdomain invitation URL.
 * Example: https://budi.undang.site or https://budi.undang.site?for=Tamu
 */
export function buildSubdomainUrl(subdomain: string, guestName?: string): string {
  const cleanSub = (subdomain || "").replace(/^\/+|\/+$/g, "");
  const domain = getRootDomain();
  const protocol =
    typeof window !== "undefined" && window.location?.protocol === "http:"
      ? "http"
      : "https";
  const port =
    typeof window !== "undefined" && window.location?.port && (domain === "localhost" || domain.includes("localhost"))
      ? `:${window.location.port}`
      : "";
  const base = `${protocol}://${cleanSub}.${domain}${port}`;

  if (guestName && guestName.trim()) {
    const encoded = encodeURIComponent(guestName.trim().replace(/\s+/g, " "));
    return `${base}?for=${encoded}`;
  }

  return base;
}
