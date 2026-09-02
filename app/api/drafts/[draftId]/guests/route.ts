import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationGuests } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { z } from "zod";
import crypto from "crypto";

async function getAuthorizedDraft(draftId: string) {
  const access = await getDraftAccess(draftId);
  return access.authorized ? access.draft : null;
}

function generateGuestSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 130) || "tamu"
  );
}

const guestSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional().default(""),
  group: z.string().max(60).optional().default("Umum"),
  status: z.enum(["pending", "sent"]).optional().default("pending"),
  sentAt: z.string().optional().nullable(),
  openedAt: z.string().optional().nullable(),
});

const bulkGuestsSchema = z.object({
  guests: z.array(guestSchema),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const draft = await getAuthorizedDraft(draftId);
  if (!draft) {
    return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 401 });
  }

  const records = await db
    .select()
    .from(invitationGuests)
    .where(eq(invitationGuests.invitationId, draftId))
    .orderBy(desc(invitationGuests.createdAt));

  const guests = records.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone ?? "",
    group: g.group ?? "Umum",
    status: g.status,
    sentAt: g.sentAt ? g.sentAt.toISOString() : undefined,
    openedAt: g.openedAt ? g.openedAt.toISOString() : undefined,
  }));

  return NextResponse.json({ guests });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.authorized || !access.draft) {
    return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 401 });
  }

  if (access.role === "viewer") {
    return NextResponse.json(
      { error: "Akun viewer hanya memiliki izin membaca daftar tamu." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = bulkGuestsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Format data tamu tidak valid." }, { status: 400 });
  }

  const { guests } = parsed.data;

  await db.transaction(async (tx) => {
    // Delete existing guests for this draft
    await tx.delete(invitationGuests).where(eq(invitationGuests.invitationId, draftId));

    if (guests.length > 0) {
      const rows = guests.map((g) => ({
        id: g.id && g.id.length >= 10 ? g.id : crypto.randomUUID(),
        invitationId: draftId,
        name: g.name.trim(),
        slug: generateGuestSlug(g.name),
        phone: g.phone ? g.phone.trim() : null,
        group: g.group ? g.group.trim() : "Umum",
        status: g.status as "pending" | "sent",
        sentAt: g.sentAt ? new Date(g.sentAt) : null,
        openedAt: g.openedAt ? new Date(g.openedAt) : null,
      }));

      // Insert in chunks of 100 to prevent query packet overflow
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await tx.insert(invitationGuests).values(chunk);
      }
    }
  });

  return NextResponse.json({ ok: true, total: guests.length });
}
