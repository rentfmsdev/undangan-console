import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rootAdminCredentials } from "@/db/schema";
import { getSessionUser, type AuthUser } from "@/modules/auth/service";

export const ADMIN_EMAILS = [
  "ardiandra45@gmail.com",
  "ardiandra53@gmail.com",
  "santaiscale@gmail.com",
];

export const SUPER_ADMIN_EMAIL = ADMIN_EMAILS[0];
export const BOOTSTRAP_SUPER_ADMIN_USERNAME = "undanganku";

/**
 * Validasi ketat apakah email pengguna adalah administrator Google yang diizinkan.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === clean);
}

export type AdminSessionResult = {
  user: AuthUser | null;
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  isLocked: boolean;
  username: string | null;
  credentialId: string | null;
};

/**
 * Memastikan sesi pengguna saat ini valid dan memiliki otorisasi admin Roots.
 * Mendukung autentikasi via Google Admin whitelist dan autentikasi lokal Roots Console.
 */
export async function getAdminSession(): Promise<AdminSessionResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      isAuthorized: false,
      isSuperAdmin: false,
      mustChangePassword: false,
      isLocked: false,
      username: null,
      credentialId: null,
    };
  }

  // 1. Cek kredensial admin lokal
  const creds = await db
    .select({
      id: rootAdminCredentials.id,
      username: rootAdminCredentials.username,
      mustChangePassword: rootAdminCredentials.mustChangePassword,
      lockedUntil: rootAdminCredentials.lockedUntil,
    })
    .from(rootAdminCredentials)
    .where(eq(rootAdminCredentials.userId, user.id))
    .limit(1);

  if (creds.length > 0) {
    const cred = creds[0];
    const isLocked = !!(cred.lockedUntil && new Date(cred.lockedUntil) > new Date());
    const mustChangePassword = cred.mustChangePassword === 1;
    const isSuperAdmin =
      cred.username.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_USERNAME ||
      isSuperAdminEmail(user.email);
    const isAuthorized = user.role === "admin" && !isLocked;

    return {
      user,
      isAuthorized,
      isSuperAdmin,
      mustChangePassword,
      isLocked,
      username: cred.username,
      credentialId: cred.id,
    };
  }

  // 2. Akun Google Admin (whitelist Google)
  const isGoogleSuper = isSuperAdminEmail(user.email);
  const isAuthorized = user.role === "admin" || isGoogleSuper;

  return {
    user,
    isAuthorized,
    isSuperAdmin: isGoogleSuper,
    mustChangePassword: false,
    isLocked: false,
    username: null,
    credentialId: null,
  };
}
