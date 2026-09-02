import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { logInvitationActivity } from "@/modules/collaboration/invitation";
import { broadcastRevokeToUser } from "@/modules/collaboration/server/presence-store";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["editor", "viewer"]),
});

export async function PATCH(
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
      { error: "Hanya pemilik (owner) undangan yang dapat mengubah peran kolaborator." },
      { status: 403 }
    );
  }

  const parsed = updateRoleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  }

  const { role } = parsed.data;

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

  await db
    .update(invitationCollaborators)
    .set({ role })
    .where(eq(invitationCollaborators.id, collaboratorId));

  await logInvitationActivity({
    invitationId: draftId,
    userId: access.user.id,
    action: "role_changed",
    metadata: { targetEmail: collab.email, oldRole: collab.role, newRole: role },
  });

  return NextResponse.json({ ok: true, role });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ draftId: string; collaboratorId: string }> }
) {
  const { draftId, collaboratorId } = await params;
  const access = await getDraftAccess(draftId);

  if (!access.authorized || !access.draft || !access.user) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
  }

  if (!access.ownedByUser && access.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya pemilik (owner) undangan yang dapat mencabut akses kolaborator." },
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

  await db
    .update(invitationCollaborators)
    .set({
      status: "revoked",
      revokedAt: new Date(),
    })
    .where(eq(invitationCollaborators.id, collaboratorId));

  await logInvitationActivity({
    invitationId: draftId,
    userId: access.user.id,
    action: "revoked",
    metadata: { targetEmail: collab.email },
  });

  if (collab.userId) {
    broadcastRevokeToUser(draftId, collab.userId);
  }

  return NextResponse.json({ ok: true, revokedId: collaboratorId });
}


