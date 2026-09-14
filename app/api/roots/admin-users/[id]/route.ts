import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rootAdminCredentials } from "@/db/schema";
import { getAdminSession, BOOTSTRAP_SUPER_ADMIN_USERNAME } from "@/modules/admin/auth";
import { generatePasswordSalt, hashPassword } from "@/modules/admin/password";
import { logAdminAudit } from "@/modules/admin/audit";

const patchActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reset_password"),
    temporaryPassword: z.string().min(8, "Kata sandi sementara minimal 8 karakter").max(128),
  }),
  z.object({
    action: z.literal("lock"),
  }),
  z.object({
    action: z.literal("unlock"),
  }),
]);

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  const { user, isAuthorized, isSuperAdmin, mustChangePassword } = await getAdminSession();
  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  if (mustChangePassword) {
    return NextResponse.json(
      { error: "Harap ganti kata sandi Anda terlebih dahulu.", mustChangePassword: true },
      { status: 403 }
    );
  }

  if (!isSuperAdmin) {
    return NextResponse.json(
      { error: "Hanya Super Administrator yang berwenang mengelola admin Roots." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = patchActionSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Aksi tidak valid.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parseResult.data;

    // Cari kredensial target
    const target = await db
      .select({
        id: rootAdminCredentials.id,
        userId: rootAdminCredentials.userId,
        username: rootAdminCredentials.username,
      })
      .from(rootAdminCredentials)
      .where(eq(rootAdminCredentials.id, id))
      .limit(1);

    if (target.length === 0) {
      return NextResponse.json({ error: "Admin tidak ditemukan." }, { status: 404 });
    }

    const admin = target[0];

    // Proteksi: Super admin tidak boleh mengunci akun bootstrap super admin atau akun dirinya sendiri
    if (data.action === "lock") {
      if (admin.username.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_USERNAME) {
        return NextResponse.json(
          { error: "Akun Super Admin bootstrap tidak dapat dinonaktifkan/dikunci." },
          { status: 400 }
        );
      }
      if (admin.userId === user.id) {
        return NextResponse.json(
          { error: "Anda tidak dapat mengunci akun Anda sendiri." },
          { status: 400 }
        );
      }

      // Kunci akun selama 10 tahun
      const lockDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
      await db
        .update(rootAdminCredentials)
        .set({ lockedUntil: lockDate })
        .where(eq(rootAdminCredentials.id, id));

      await logAdminAudit({
        action: "lock_account",
        actorUserId: user.id,
        targetUserId: admin.userId,
        request,
        details: { username: admin.username },
      });

      return NextResponse.json({ success: true, message: `Akun ${admin.username} berhasil dikunci.` });
    }

    if (data.action === "unlock") {
      await db
        .update(rootAdminCredentials)
        .set({ lockedUntil: null, failedAttempts: 0 })
        .where(eq(rootAdminCredentials.id, id));

      await logAdminAudit({
        action: "unlock_account",
        actorUserId: user.id,
        targetUserId: admin.userId,
        request,
        details: { username: admin.username },
      });

      return NextResponse.json({ success: true, message: `Akun ${admin.username} berhasil dibuka kuncinya.` });
    }

    if (data.action === "reset_password") {
      const salt = generatePasswordSalt();
      const hash = await hashPassword(data.temporaryPassword, salt);

      await db
        .update(rootAdminCredentials)
        .set({
          passwordHash: hash,
          passwordSalt: salt,
          mustChangePassword: 1,
          failedAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(rootAdminCredentials.id, id));

      await logAdminAudit({
        action: "reset_password",
        actorUserId: user.id,
        targetUserId: admin.userId,
        request,
        details: { username: admin.username },
      });

      return NextResponse.json({
        success: true,
        message: `Kata sandi akun ${admin.username} berhasil direset. Admin harus menggantinya saat login berikutnya.`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("[roots/admin-users PATCH] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses permintaan." },
      { status: 500 }
    );
  }
}
