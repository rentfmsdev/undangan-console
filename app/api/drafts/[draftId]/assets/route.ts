import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { invitationAssets } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";

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

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.user) return NextResponse.json({ error: "Silakan masuk sebelum upload file." }, { status: 401 });
  if (!access.authorized || !access.draft) return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 403 });
  if (access.role === "viewer") {
    return NextResponse.json({ error: "Akun viewer tidak memiliki izin mengunggah file." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File foto tidak ditemukan." }, { status: 400 });
  const supported = supportedFiles[file.type];
  if (!supported) return NextResponse.json({ error: "Format file tidak didukung. Gunakan gambar JPEG/PNG/WebP/AVIF atau audio MP3/M4A/OGG/WebM." }, { status: 415 });
  if (file.size > supported.maxSize) return NextResponse.json({ error: supported.kind === "image" ? "Ukuran foto maksimal 8 MB." : "Ukuran musik maksimal 15 MB." }, { status: 413 });

  const assetId = randomUUID();
  const fileName = `${assetId}.${supported.extension}`;
  const relativeDirectory = path.join("uploads", access.user.id, draftId);
  const directory = path.join(process.cwd(), "public", relativeDirectory);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));

  const url = `/${relativeDirectory.replaceAll(path.sep, "/")}/${fileName}`;
  await db.insert(invitationAssets).values({
    id: assetId,
    invitationId: draftId,
    kind: supported.kind,
    url,
    alt: file.name.slice(0, 255),
  });

  return NextResponse.json({ id: assetId, url, name: file.name });
}
