import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { invitationCollaborators, invitations, users } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";
import { getTemplateById } from "@/templates/registry";

const invitationActionSchema = z.object({
  invitationId: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const records = await db
    .select({
      id: invitationCollaborators.id,
      invitationId: invitationCollaborators.invitationId,
      email: invitationCollaborators.email,
      role: invitationCollaborators.role,
      status: invitationCollaborators.status,
      expiresAt: invitationCollaborators.expiresAt,
      createdAt: invitationCollaborators.createdAt,
      invitationTitle: invitations.title,
      templateId: invitations.templateId,
      inviterName: users.name,
      inviterEmail: users.email,
      inviterAvatar: users.avatarUrl,
    })
    .from(invitationCollaborators)
    .innerJoin(invitations, eq(invitationCollaborators.invitationId, invitations.id))
    .leftJoin(users, eq(invitationCollaborators.invitedBy, users.id))
    .where(
      and(
        or(
          eq(invitationCollaborators.userId, user.id),
          eq(invitationCollaborators.email, user.email)
        ),
        eq(invitationCollaborators.status, "pending")
      )
    )
    .orderBy(desc(invitationCollaborators.createdAt));

  const pendingInvitations = records.map((r) => {
    const template = getTemplateById(r.templateId);
    const isExpired = r.expiresAt ? new Date(r.expiresAt) < new Date() : false;
    return {
      id: r.id,
      invitationId: r.invitationId,
      invitationTitle: r.invitationTitle,
      role: r.role,
      status: isExpired ? "expired" : r.status,
      isExpired,
      templateCode: template?.code ?? "hjydg",
      templateName: template?.name ?? "Wedding Lampung Elegance",
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      inviter: {
        name: r.inviterName ?? "Pemilik Undangan",
        email: r.inviterEmail ?? "",
        avatarUrl: r.inviterAvatar,
      },
    };
  });

  return NextResponse.json({ invitations: pendingInvitations });
}

/**
 * Accept/decline from the authenticated in-app inbox. Tokens intentionally are
 * never returned by GET, so this endpoint verifies the currently signed-in
 * recipient against the pending collaboration row instead.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const parsed = invitationActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Aksi undangan tidak valid." }, { status: 400 });

  const { invitationId, action } = parsed.data;
  const [collab] = await db
    .select({
      id: invitationCollaborators.id,
      invitationId: invitationCollaborators.invitationId,
      email: invitationCollaborators.email,
      role: invitationCollaborators.role,
      status: invitationCollaborators.status,
      expiresAt: invitationCollaborators.expiresAt,
      templateId: invitations.templateId,
    })
    .from(invitationCollaborators)
    .innerJoin(invitations, eq(invitationCollaborators.invitationId, invitations.id))
    .where(
      and(
        eq(invitationCollaborators.id, invitationId),
        or(
          eq(invitationCollaborators.userId, user.id),
          eq(invitationCollaborators.email, user.email)
        )
      )
    )
    .limit(1);

  if (!collab) return NextResponse.json({ error: "Undangan kolaborasi tidak ditemukan untuk akun ini." }, { status: 404 });
  if (collab.status !== "pending") return NextResponse.json({ error: "Undangan ini sudah tidak dapat diproses." }, { status: 409 });
  if (collab.expiresAt && collab.expiresAt < new Date()) {
    await db.update(invitationCollaborators).set({ status: "expired" }).where(eq(invitationCollaborators.id, collab.id));
    return NextResponse.json({ error: "Undangan ini sudah kedaluwarsa." }, { status: 410 });
  }

  const now = new Date();
  if (action === "accept") {
    await db.update(invitationCollaborators).set({ userId: user.id, status: "accepted", acceptedAt: now }).where(eq(invitationCollaborators.id, collab.id));
    const template = getTemplateById(collab.templateId);
    return NextResponse.json({ ok: true, action, draftId: collab.invitationId, templateCode: template?.code ?? "hjydg" });
  }

  await db.update(invitationCollaborators).set({ userId: user.id, status: "declined", declinedAt: now }).where(eq(invitationCollaborators.id, collab.id));
  return NextResponse.json({ ok: true, action });
}
