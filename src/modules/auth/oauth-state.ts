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
