import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitations, users } from "@/db/schema";
import { hashInviteToken } from "@/modules/collaboration/invitation";
import { getTemplateById } from "@/templates/registry";
import { getSessionUser } from "@/modules/auth/service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Token undangan tidak valid." }, { status: 400 });
  }

  const tokenHash = hashInviteToken(token);

  const [collab] = await db
    .select({
      id: invitationCollaborators.id,
      invitationId: invitationCollaborators.invitationId,
      email: invitationCollaborators.email,
      role: invitationCollaborators.role,
      status: invitationCollaborators.status,
      expiresAt: invitationCollaborators.expiresAt,
      invitedBy: invitationCollaborators.invitedBy,
      invitationTitle: invitations.title,
      templateId: invitations.templateId,
      inviterName: users.name,
      inviterEmail: users.email,
      inviterAvatar: users.avatarUrl,
    })
    .from(invitationCollaborators)
    .innerJoin(invitations, eq(invitationCollaborators.invitationId, invitations.id))
    .leftJoin(users, eq(invitationCollaborators.invitedBy, users.id))
    .where(eq(invitationCollaborators.inviteTokenHash, tokenHash))
    .limit(1);

  if (!collab) {
    return NextResponse.json(
      { error: "Tautan undangan tidak ditemukan atau sudah tidak berlaku." },
      { status: 404 }
    );
  }

  const template = getTemplateById(collab.templateId);
  const isExpired = collab.expiresAt ? new Date(collab.expiresAt) < new Date() : false;
  const currentUser = await getSessionUser();

  return NextResponse.json({
    id: collab.id,
    invitationId: collab.invitationId,
    targetEmail: collab.email,
    role: collab.role,
    status: isExpired && collab.status === "pending" ? "expired" : collab.status,
    isExpired,
    invitationTitle: collab.invitationTitle,
    templateCode: template?.code ?? "hjydg",
    templateName: template?.name ?? "Wedding Lampung Elegance",
    inviter: {
      name: collab.inviterName ?? "Pemilik Undangan",
      email: collab.inviterEmail ?? "",
      avatarUrl: collab.inviterAvatar,
    },
    currentUser: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
          matchesEmail: currentUser.email.toLowerCase().trim() === collab.email.toLowerCase().trim(),
        }
      : null,
  });
}
