import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";

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
      { error: "Hanya pemilik (owner) undangan yang dapat menghapus kolaborator." },
      { status: 403 }
    );
  }

  await db
    .delete(invitationCollaborators)
    .where(
      and(
        eq(invitationCollaborators.id, collaboratorId),
        eq(invitationCollaborators.invitationId, draftId)
      )
    );

  return NextResponse.json({ ok: true, removedId: collaboratorId });
}
