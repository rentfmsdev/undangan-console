import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { invitationAssets, invitations } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";

const supportedFiles: Record<string, { extension: string; kind: "image" | "audio"; maxSize: number }> = {
  "image/jpeg": { extension: "jpg", kind: "image", maxSize: 8 * 1024 * 1024 },
  "image/png": { extension: "png", kind: "image", maxSize: 8 * 1024 * 1024 },
  "image/webp": { extension: "webp", kind: "image", maxSize: 8 * 1024 * 1024 },
  "image/avif": { extension: "avif", kind: "image", maxSize: 8 * 1024 * 1024 },
  "audio/mpeg": { extension: "mp3", kind: "audio", maxSize: 15 * 1024 * 1024 },
  "audio/mp4": { extension: "m4a", kind: "audio", maxSize: 15 * 1024 * 1024 },
  "audio/ogg": { extension: "ogg", kind: "audio", maxSize: 15 * 1024 * 1024 },
  "audio/webm": { extension: "webm", kind: "audio", maxSize: 15 * 1024 * 1024 },
};

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk melihat Asset Saya." }, { status: 401 });

  const kindParam = new URL(request.url).searchParams.get("kind");
  const kind = kindParam === "image" || kindParam === "audio" ? kindParam : null;
  const rows = await db
    .select({
      id: invitationAssets.id,
      invitationId: invitationAssets.invitationId,
      kind: invitationAssets.kind,
      url: invitationAssets.url,
      name: invitationAssets.alt,
      createdAt: invitationAssets.createdAt,
    })
    .from(invitationAssets)
    .innerJoin(invitations, eq(invitationAssets.invitationId, invitations.id))
    .where(kind ? and(eq(invitations.userId, user.id), eq(invitationAssets.kind, kind)) : eq(invitations.userId, user.id))
    .orderBy(desc(invitationAssets.createdAt));

  return NextResponse.json({ assets: rows });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk mengunggah asset." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const requestedDraftId = (form.get("draftId") as string | null) ?? new URL(request.url).searchParams.get("draftId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  const supported = supportedFiles[file.type];
  if (!supported) {
    return NextResponse.json(
      { error: "Format file tidak didukung. Gunakan gambar JPEG/PNG/WebP/AVIF atau audio MP3/M4A/OGG/WebM." },
      { status: 415 }
    );
  }

  if (file.size > supported.maxSize) {
    return NextResponse.json(
      { error: supported.kind === "image" ? "Ukuran foto maksimal 8 MB." : "Ukuran musik maksimal 15 MB." },
      { status: 413 }
    );
  }

  // Find target invitation/draft owned by this user
  let targetInvitationId = requestedDraftId;
  if (targetInvitationId) {
    const check = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(and(eq(invitations.id, targetInvitationId), eq(invitations.userId, user.id)))
      .limit(1);
    if (!check.length) targetInvitationId = null;
  }

  if (!targetInvitationId) {
    const latest = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.userId, user.id))
      .orderBy(desc(invitations.updatedAt))
      .limit(1);
    targetInvitationId = latest[0]?.id ?? null;
  }

  if (!targetInvitationId) {
    return NextResponse.json(
      { error: "Belum ada undangan aktif untuk menyimpan asset ini. Silakan buat undangan terlebih dahulu." },
      { status: 400 }
    );
  }

  const assetId = randomUUID();
  const fileName = `${assetId}.${supported.extension}`;
  const relativeDirectory = path.join("uploads", user.id, targetInvitationId);
  const directory = path.join(process.cwd(), "public", relativeDirectory);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));

  const url = `/${relativeDirectory.replaceAll(path.sep, "/")}/${fileName}`;
  await db.insert(invitationAssets).values({
    id: assetId,
    invitationId: targetInvitationId,
    kind: supported.kind,
    url,
    alt: file.name.slice(0, 255),
  });

  return NextResponse.json({
    id: assetId,
    invitationId: targetInvitationId,
    kind: supported.kind,
    url,
    name: file.name,
    createdAt: new Date().toISOString(),
  });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk menghapus asset." }, { status: 401 });

  const urlObj = new URL(request.url);
  const assetId = urlObj.searchParams.get("id");
  if (!assetId) return NextResponse.json({ error: "ID asset diperlukan." }, { status: 400 });

  const rows = await db
    .select({ id: invitationAssets.id, url: invitationAssets.url })
    .from(invitationAssets)
    .innerJoin(invitations, eq(invitationAssets.invitationId, invitations.id))
    .where(and(eq(invitationAssets.id, assetId), eq(invitations.userId, user.id)))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Asset tidak ditemukan atau Anda tidak memiliki izin." }, { status: 404 });
  }

  const asset = rows[0];
  await db.delete(invitationAssets).where(eq(invitationAssets.id, assetId));

  // Try to remove local file silently
  try {
    const filePath = path.join(process.cwd(), "public", asset.url.replace(/^\//, "").replaceAll("/", path.sep));
    await unlink(filePath).catch(() => {});
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, id: assetId });
}
