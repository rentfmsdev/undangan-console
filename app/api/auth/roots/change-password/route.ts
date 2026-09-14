import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rootAdminCredentials } from "@/db/schema";
import { getAdminSession } from "@/modules/admin/auth";
import { generatePasswordSalt, hashPassword, verifyPassword } from "@/modules/admin/password";
import { logAdminAudit } from "@/modules/admin/audit";
import { createSession, deleteSession, SESSION_COOKIE_NAME } from "@/modules/auth/service";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini harus diisi"),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter").max(128),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Kata sandi baru tidak boleh sama dengan kata sandi lama",
    path: ["newPassword"],
  });

export async function POST(request: Request) {
  try {
    const { user, isAuthorized, credentialId } = await getAdminSession();

    if (!user || !isAuthorized) {
      return NextResponse.json(
        { error: "Akses ditolak. Sesi administrator tidak valid." },
        { status: 401 }
      );
    }

    if (!credentialId) {
      return NextResponse.json(
        { error: "Akun ini masuk melalui Google dan tidak menggunakan kata sandi lokal Roots." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parseResult = changePasswordSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Data formulir tidak valid.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Ambil record kredensial
    const creds = await db
      .select({
        id: rootAdminCredentials.id,
        passwordHash: rootAdminCredentials.passwordHash,
        passwordSalt: rootAdminCredentials.passwordSalt,
        username: rootAdminCredentials.username,
      })
      .from(rootAdminCredentials)
      .where(eq(rootAdminCredentials.id, credentialId))
      .limit(1);

    if (creds.length === 0) {
      return NextResponse.json({ error: "Kredensial tidak ditemukan." }, { status: 404 });
    }

    const cred = creds[0];

    // Verifikasi password saat ini
    const isCurrentCorrect = await verifyPassword(currentPassword, cred.passwordSalt, cred.passwordHash);
    if (!isCurrentCorrect) {
      await logAdminAudit({
        action: "change_password",
        actorUserId: user.id,
        targetUserId: user.id,
        request,
        details: { username: cred.username, success: false, reason: "invalid_current_password" },
      });
      return NextResponse.json(
        { error: "Kata sandi saat ini salah." },
        { status: 400 }
      );
    }

    // Buat salt dan hash baru
    const newSalt = generatePasswordSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    // Update kredensial: set must_change_password = 0
    await db
      .update(rootAdminCredentials)
      .set({
        passwordHash: newHash,
        passwordSalt: newSalt,
        mustChangePassword: 0,
        failedAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(rootAdminCredentials.id, credentialId));

    // Regenerasi sesi baru
    const cookieStore = await cookies();
    const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (currentToken) {
      await deleteSession(currentToken);
    }
    const newSessionToken = await createSession(user.id);

    // Log audit
    await logAdminAudit({
      action: "change_password",
      actorUserId: user.id,
      targetUserId: user.id,
      request,
      details: { username: cred.username, success: true },
    });

    const response = NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui.",
    });

    response.cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("[roots/change-password] Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kata sandi. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
