import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { generateInviteToken, hashInviteToken, logInvitationActivity, queueOutboxEmail } from "@/modules/collaboration/invitation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string; collaboratorId: string }> }
) {
  const { draftId, collaboratorId } = await params;
  const access = await getDraftAccess(draftId);

  if (!access.authorized || !access.draft || !access.user) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  if (!access.ownedByUser && access.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya pemilik (owner) undangan yang dapat mengirim ulang undangan." },
      { status: 403 }
    );
  }

  const [collab] = await db
    .select()
    .from(invitationCollaborators)
    .where(
      and(
        eq(invitationCollaborators.id, collaboratorId),
        eq(invitationCollaborators.invitationId, draftId)
      )
    )
    .limit(1);

  if (!collab) {
    return NextResponse.json({ error: "Data kolaborator tidak ditemukan." }, { status: 404 });
  }

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db
    .update(invitationCollaborators)
    .set({
      inviteTokenHash: tokenHash,
      expiresAt,
      status: "pending",
      declinedAt: null,
      revokedAt: null,
    })
    .where(eq(invitationCollaborators.id, collaboratorId));

  await logInvitationActivity({
    invitationId: draftId,
    userId: access.user.id,
    action: "resend",
    metadata: { targetEmail: collab.email, expiresAt: expiresAt.toISOString() },
  });

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/collaboration/invite/${rawToken}`;

  await queueOutboxEmail({
    type: "collaboration_invite_resend",
    recipient: collab.email,
    payload: {
      draftTitle: access.draft.title,
      inviterName: access.user.name,
      role: collab.role,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Undangan untuk ${collab.email} berhasil diperbarui dan dikirim ulang!`,
    inviteUrl,
  });
}
