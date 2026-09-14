import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { getAdminSession } from "@/modules/admin/auth";
import { logAdminAudit } from "@/modules/admin/audit";
import { normalizeMetaPixelId, PLATFORM_SETTING_KEYS } from "@/modules/platform-settings/constants";
import { getMetaPixelIdSetting } from "@/modules/platform-settings/service";

const payloadSchema = z.object({ metaPixelId: z.string().trim().max(32).optional().default("") });

async function requireSuperAdmin() {
  const session = await getAdminSession();
  return session.user && session.isAuthorized && session.isSuperAdmin && !session.mustChangePassword ? session : null;
}

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Akses Super Admin diperlukan." }, { status: 403 });
  return NextResponse.json({ metaPixelId: await getMetaPixelIdSetting() });
}

export async function PUT(request: Request) {
  const session = await requireSuperAdmin();
  if (!session?.user) return NextResponse.json({ error: "Akses Super Admin diperlukan." }, { status: 403 });
  const adminUser = session.user;

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data pengaturan tidak valid." }, { status: 400 });

  const metaPixelId = parsed.data.metaPixelId ? normalizeMetaPixelId(parsed.data.metaPixelId) : null;
  if (parsed.data.metaPixelId && !metaPixelId) {
    return NextResponse.json({ error: "Pixel ID Meta harus berupa angka." }, { status: 400 });
  }

  const value = { pixelId: metaPixelId };
  await db
    .insert(platformSettings)
    .values({ key: PLATFORM_SETTING_KEYS.metaPixelId, value, updatedBy: adminUser.id })
    .onDuplicateKeyUpdate({ set: { value, updatedBy: adminUser.id, updatedAt: new Date() } });

  await logAdminAudit({ action: "platform_setting_updated", actorUserId: adminUser.id, request, details: { key: PLATFORM_SETTING_KEYS.metaPixelId, configured: Boolean(metaPixelId) } });
  return NextResponse.json({ metaPixelId });
}
