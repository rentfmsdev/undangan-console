import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const cookiePrefix = "undangan_edit_";

export function createEditToken() {
  return randomBytes(32).toString("base64url");
}

export function createRecoveryCode() {
  return randomBytes(5).toString("hex").toUpperCase();
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function isMatchingSecret(value: string | undefined, expectedHash: string) {
  if (!value) return false;
  const valueHash = Buffer.from(hashSecret(value));
  const expected = Buffer.from(expectedHash);
  return valueHash.length === expected.length && timingSafeEqual(valueHash, expected);
}

export function editCookieName(draftId: string) {
  return `${cookiePrefix}${draftId}`;
}
