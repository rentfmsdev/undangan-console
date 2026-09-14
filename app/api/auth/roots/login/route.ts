import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rootAdminCredentials, users } from "@/db/schema";
import { verifyPassword, dummyVerifyPassword } from "@/modules/admin/password";
import { logAdminAudit } from "@/modules/admin/audit";
import { checkRateLimit, getRequestClientIp } from "@/modules/security/rate-limit";
import { createSession, deleteSession, SESSION_COOKIE_NAME } from "@/modules/auth/service";

const loginSchema = z.object({
  username: z.string().trim().min(3).max(50).toLowerCase(),
  password: z.string().min(1).max(128),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const clientIp = getRequestClientIp(request);
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Username atau kata sandi tidak valid." },
        { status: 400 }
      );
    }

    const { username, password } = parseResult.data;

    // Rate limiting per IP + username (10 attempts per 15 minutes)
    const rateLimitKey = `roots_login:${clientIp}:${username}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, LOCKOUT_MINUTES * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan masuk. Silakan tunggu ${rateCheck.retryAfterSeconds} detik.` },
        { status: 429 }
      );
    }

    // Cari akun credential yang terhubung ke pengguna
    const found = await db
      .select({
        credId: rootAdminCredentials.id,
        userId: rootAdminCredentials.userId,
        username: rootAdminCredentials.username,
        passwordHash: rootAdminCredentials.passwordHash,
        passwordSalt: rootAdminCredentials.passwordSalt,
        mustChangePassword: rootAdminCredentials.mustChangePassword,
        failedAttempts: rootAdminCredentials.failedAttempts,
        lockedUntil: rootAdminCredentials.lockedUntil,
        userRole: users.role,
      })
      .from(rootAdminCredentials)
      .innerJoin(users, eq(rootAdminCredentials.userId, users.id))
      .where(eq(rootAdminCredentials.username, username))
      .limit(1);

    if (found.length === 0) {
      // Jalankan dummy hashing agar waktu eksekusi seragam (cegah user enumeration)
      await dummyVerifyPassword(password);
      await logAdminAudit({
        action: "login_failed",
        request,
        details: { username, reason: "user_not_found" },
      });
      return NextResponse.json(
        { error: "Username atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    const admin = found[0];

    // Cek apakah akun sedang terkunci
    const now = new Date();
    if (admin.lockedUntil && new Date(admin.lockedUntil) > now) {
      const remainingSeconds = Math.ceil((new Date(admin.lockedUntil).getTime() - now.getTime()) / 1000);
      return NextResponse.json(
        { error: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${Math.ceil(remainingSeconds / 60)} menit.` },
        { status: 423 }
      );
    }

    // Verifikasi password konstan waktu
    const isPasswordCorrect = await verifyPassword(password, admin.passwordSalt, admin.passwordHash);

    if (!isPasswordCorrect) {
      const nextAttempts = (admin.failedAttempts || 0) + 1;
      let nextLockedUntil: Date | null = null;

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        nextLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await logAdminAudit({
          action: "account_locked",
          targetUserId: admin.userId,
          request,
          details: { username, attempts: nextAttempts, lockedForMinutes: LOCKOUT_MINUTES },
        });
      }

      await db
        .update(rootAdminCredentials)
        .set({
          failedAttempts: nextAttempts,
          lockedUntil: nextLockedUntil,
        })
        .where(eq(rootAdminCredentials.id, admin.credId));

      await logAdminAudit({
        action: "login_failed",
        targetUserId: admin.userId,
        request,
        details: { username, reason: "invalid_password", attempts: nextAttempts },
      });

      return NextResponse.json(
        { error: "Username atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    // Pastikan user memiliki role admin
    if (admin.userRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Pengguna bukan administrator." },
        { status: 403 }
      );
    }

    // Sukses: Reset counter percobaan gagal & perbarui lastLoginAt
    await db
      .update(rootAdminCredentials)
      .set({
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      })
      .where(eq(rootAdminCredentials.id, admin.credId));

    // Regenerasi session: Hapus session lama jika ada di cookie
    const cookieStore = await cookies();
    const existingToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (existingToken) {
      await deleteSession(existingToken);
    }

    // Buat session baru di database
    const newSessionToken = await createSession(admin.userId);

    // Catat log audit login berhasil
    await logAdminAudit({
      action: "login_success",
      actorUserId: admin.userId,
      targetUserId: admin.userId,
      request,
      details: { username },
    });

    const response = NextResponse.json({
      success: true,
      mustChangePassword: admin.mustChangePassword === 1,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("[roots/login] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada sistem masuk. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
