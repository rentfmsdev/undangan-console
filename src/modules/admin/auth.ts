import "server-only";
import { getSessionUser, type AuthUser } from "@/modules/auth/service";

export const ADMIN_EMAILS = [
  "ardiandra45@gmail.com",
  "ardiandra53@gmail.com",
];

export const SUPER_ADMIN_EMAIL = ADMIN_EMAILS[0];

/**
 * Validasi ketat apakah email pengguna adalah administrator yang diizinkan.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === clean);
}

/**
 * Memastikan sesi pengguna saat ini valid dan merupakan super administrator.
 */
export async function getAdminSession(): Promise<{
  user: AuthUser | null;
  isAuthorized: boolean;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, isAuthorized: false };
  }

  const isAuthorized = isSuperAdminEmail(user.email);
  return { user, isAuthorized };
}
