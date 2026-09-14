import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { rootAdminCredentials, users } from "@/db/schema";
import { getAdminSession } from "@/modules/admin/auth";
import { generatePasswordSalt, hashPassword } from "@/modules/admin/password";
import { logAdminAudit } from "@/modules/admin/audit";

export const dynamic = "force-dynamic";

const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,30}$/, "Username harus 3-30 karakter alfanumerik atau tanda hubung/garis bawah"),
  name: z.string().trim().min(2, "Nama tampilan minimal 2 karakter").max(100),
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  temporaryPassword: z.string().min(8, "Kata sandi sementara minimal 8 karakter").max(128),
});

export async function GET() {
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

  const now = new Date();
  const list = await db
    .select({
      id: rootAdminCredentials.id,
      userId: rootAdminCredentials.userId,
      username: rootAdminCredentials.username,
      name: users.name,
      email: users.email,
      role: users.role,
      mustChangePassword: rootAdminCredentials.mustChangePassword,
      failedAttempts: rootAdminCredentials.failedAttempts,
      lockedUntil: rootAdminCredentials.lockedUntil,
      lastLoginAt: rootAdminCredentials.lastLoginAt,
      createdAt: rootAdminCredentials.createdAt,
    })
    .from(rootAdminCredentials)
    .innerJoin(users, eq(rootAdminCredentials.userId, users.id))
    .orderBy(desc(rootAdminCredentials.createdAt));

  const admins = list.map((a) => ({
    id: a.id,
    userId: a.userId,
    username: a.username,
    name: a.name,
    email: a.email,
    role: a.role,
    mustChangePassword: a.mustChangePassword === 1,
    failedAttempts: a.failedAttempts,
    isLocked: !!(a.lockedUntil && new Date(a.lockedUntil) > now),
    lockedUntil: a.lockedUntil,
    lastLoginAt: a.lastLoginAt,
    createdAt: a.createdAt,
  }));

  return NextResponse.json({ admins, isSuperAdmin });
}

export async function POST(request: Request) {
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
      { error: "Hanya Super Administrator yang berwenang menambahkan administrator baru." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = createAdminSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Data formulir tidak valid.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { username, name, email, temporaryPassword } = parseResult.data;
    const finalEmail = email || `${username}@roots.internal.invalid`;

    // Cek apakah username sudah ada
    const existingCred = await db
      .select({ id: rootAdminCredentials.id })
      .from(rootAdminCredentials)
      .where(eq(rootAdminCredentials.username, username))
      .limit(1);

    if (existingCred.length > 0) {
      return NextResponse.json({ error: "Username tersebut sudah digunakan." }, { status: 400 });
    }

    // Cek apakah email sudah ada di users
    const existingUser = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, finalEmail))
      .limit(1);

    let newUserId: string;

    if (existingUser.length > 0) {
      // Jika user sudah ada (misal email sama), pastikan belum punya kredensial roots lain
      const userCred = await db
        .select({ id: rootAdminCredentials.id })
        .from(rootAdminCredentials)
        .where(eq(rootAdminCredentials.userId, existingUser[0].id))
        .limit(1);

      if (userCred.length > 0) {
        return NextResponse.json(
          { error: "Pengguna dengan email tersebut sudah memiliki akun Roots Admin." },
          { status: 400 }
        );
      }

      newUserId = existingUser[0].id;
      await db
        .update(users)
        .set({ role: "admin", name })
        .where(eq(users.id, newUserId));
    } else {
      newUserId = crypto.randomUUID();
      await db.insert(users).values({
        id: newUserId,
        email: finalEmail,
        name,
        role: "admin",
      });
    }

    // Generate hash & salt untuk temporary password
    const salt = generatePasswordSalt();
    const hash = await hashPassword(temporaryPassword, salt);
    const newCredId = crypto.randomUUID();

    await db.insert(rootAdminCredentials).values({
      id: newCredId,
      userId: newUserId,
      username,
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: 1, // Wajib ganti saat pertama login
      failedAttempts: 0,
      createdBy: user.id,
    });

    // Catat log audit
    await logAdminAudit({
      action: "create_admin",
      actorUserId: user.id,
      targetUserId: newUserId,
      request,
      details: { username, email: finalEmail },
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: newCredId,
        userId: newUserId,
        username,
        name,
        email: finalEmail,
      },
    });
  } catch (error) {
    console.error("[roots/admin-users POST] Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat akun admin Roots baru. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
