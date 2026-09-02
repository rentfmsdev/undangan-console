import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitations, users } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";
import { getTemplateById } from "@/templates/registry";

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
