import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitations } from "@/db/schema";
import { hashInviteToken, logInvitationActivity } from "@/modules/collaboration/invitation";
import { getSessionUser } from "@/modules/auth/service";
import { getTemplateById } from "@/templates/registry";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Silakan masuk dengan akun Google terlebih dahulu." },
      { status: 401 }
    );
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
      templateId: invitations.templateId,
    })
    .from(invitationCollaborators)
    .innerJoin(invitations, eq(invitationCollaborators.invitationId, invitations.id))
    .where(eq(invitationCollaborators.inviteTokenHash, tokenHash))
    .limit(1);

  if (!collab) {
    return NextResponse.json(
      { error: "Undangan tidak ditemukan atau sudah tidak berlaku." },
      { status: 404 }
    );
  }

  if (collab.status === "declined" || collab.status === "expired") {
    return NextResponse.json(
      { error: "Undangan ini tidak lagi aktif. Minta pemilik untuk mengirim undangan baru." },
      { status: 400 }
    );
  }

  if (collab.status === "revoked") {
    return NextResponse.json(
      { error: "Undangan ini telah dicabut oleh pemilik undangan." },
      { status: 400 }
    );
  }

  if (collab.expiresAt && new Date(collab.expiresAt) < new Date()) {
    await db
      .update(invitationCollaborators)
      .set({ status: "expired" })
      .where(eq(invitationCollaborators.id, collab.id));

    return NextResponse.json(
      { error: "Undangan ini sudah kedaluwarsa. Minta pemilik untuk mengirim ulang undangan." },
      { status: 400 }
    );
  }

  // Security Check: Target email must match logged-in user email
  if (collab.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
    return NextResponse.json(
      {
        error: `Undangan ini ditujukan untuk email ${collab.email}. Anda saat ini masuk sebagai ${user.email}. Silakan masuk dengan akun yang sesuai.`,
      },
      { status: 403 }
    );
  }

  // Idempotent for the intended account; a second click must not mutate history.
  if (collab.status === "accepted") {
    const template = getTemplateById(collab.templateId);
    return NextResponse.json({
      ok: true,
      message: "Undangan kolaborasi sudah diterima.",
      draftId: collab.invitationId,
      templateCode: template?.code ?? "hjydg",
    });
  }

  // Accept the invitation.
  await db
    .update(invitationCollaborators)
    .set({
      userId: user.id,
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(invitationCollaborators.id, collab.id));

  await logInvitationActivity({
    invitationId: collab.invitationId,
    userId: user.id,
    action: "accepted",
    metadata: { role: collab.role, acceptedByEmail: user.email },
  });

  const template = getTemplateById(collab.templateId);

  return NextResponse.json({
    ok: true,
    message: "Undangan kolaborasi berhasil diterima!",
    draftId: collab.invitationId,
    templateCode: template?.code ?? "hjydg",
  });
}
