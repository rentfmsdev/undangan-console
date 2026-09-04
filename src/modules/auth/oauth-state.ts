import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_STATE_COOKIE_NAME = "undangan_oauth_state";
export const OAUTH_RETURN_TO_COOKIE_NAME = "undangan_oauth_return_to";
export const OAUTH_COOKIE_PATH = "/api/auth/google/callback";

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function isValidOAuthState(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function sanitizeReturnTo(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const parsed = new URL(value, "http://undangan.local");
    if (parsed.origin !== "http://undangan.local") return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function getAppBaseUrl(request?: Request): string {
  // 1. If request has forwarded host / host that is not internal/localhost, use it as live domain
  if (request) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("web:") && !host.includes("gateway")) {
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }

  // 2. If GOOGLE_REDIRECT_URI is defined and not localhost, its origin is the canonical domain
  if (process.env.GOOGLE_REDIRECT_URI) {
    try {
      const redirectOrigin = new URL(process.env.GOOGLE_REDIRECT_URI).origin;
      if (redirectOrigin && !redirectOrigin.includes("localhost") && !redirectOrigin.includes("127.0.0.1")) {
        return redirectOrigin.replace(/\/+$/, "");
      }
    } catch {
      // ignore
    }
  }

  // 3. If NEXT_PUBLIC_APP_URL or APP_URL is defined and not localhost
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/+$/, "");
  }

  // 4. If request origin is valid and not localhost
  if (request) {
    try {
      const origin = new URL(request.url).origin;
      if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes("web:")) {
        return origin;
      }
    } catch {
      // ignore
    }
  }

  // 5. Fallback to configured envUrl or localhost
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}
