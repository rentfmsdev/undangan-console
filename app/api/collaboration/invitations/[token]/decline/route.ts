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

  if (collab.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
    return NextResponse.json(
      { error: "Undangan ini ditujukan untuk akun Google yang berbeda." },
      { status: 403 }
    );
  }

  if (collab.status === "revoked" || collab.status === "expired") {
    return NextResponse.json({ error: "Undangan ini tidak lagi aktif." }, { status: 400 });
  }

  if (collab.expiresAt && new Date(collab.expiresAt) < new Date()) {
    await db.update(invitationCollaborators).set({ status: "expired" }).where(eq(invitationCollaborators.id, collab.id));
    return NextResponse.json({ error: "Undangan ini sudah kedaluwarsa." }, { status: 400 });
  }

  if (collab.status === "accepted") {
    return NextResponse.json({ error: "Undangan yang sudah diterima tidak dapat ditolak dari tautan ini. Minta pemilik mencabut akses." }, { status: 400 });
  }

  if (collab.status === "declined") {
    return NextResponse.json({ ok: true, message: "Undangan kolaborasi sudah ditolak." });
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
