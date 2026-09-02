import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators } from "@/db/schema";
import { hashInviteToken, logInvitationActivity } from "@/modules/collaboration/invitation";
import { getSessionUser } from "@/modules/auth/service";

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
    .select()
    .from(invitationCollaborators)
    .where(eq(invitationCollaborators.inviteTokenHash, tokenHash))
    .limit(1);

  if (!collab) {
    return NextResponse.json(
      { error: "Undangan tidak ditemukan atau sudah tidak berlaku." },
      { status: 404 }
    );
  }

  await db
    .update(invitationCollaborators)
    .set({
      userId: user.id,
      status: "declined",
      declinedAt: new Date(),
    })
    .where(eq(invitationCollaborators.id, collab.id));

  await logInvitationActivity({
    invitationId: collab.invitationId,
    userId: user.id,
    action: "declined",
    metadata: { targetEmail: collab.email, declinedByEmail: user.email },
  });

  return NextResponse.json({ ok: true, message: "Undangan kolaborasi telah ditolak." });
}
