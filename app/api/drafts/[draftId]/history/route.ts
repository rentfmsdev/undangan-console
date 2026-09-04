import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import * as Y from "yjs";
import { db } from "@/db/client";
import { invitationCollaborationSnapshots } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { extractStateFromYDoc } from "@/modules/collaboration/domain/crdt-mapper";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.authorized || !access.draft) {
    return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 401 });
  }

  const snapshotId = new URL(request.url).searchParams.get("snapshotId");
  if (snapshotId) {
    const [snapshot] = await db
      .select({
        id: invitationCollaborationSnapshots.id,
        revision: invitationCollaborationSnapshots.revision,
        createdAt: invitationCollaborationSnapshots.createdAt,
        snapshot: invitationCollaborationSnapshots.snapshot,
      })
      .from(invitationCollaborationSnapshots)
      .where(and(eq(invitationCollaborationSnapshots.id, snapshotId), eq(invitationCollaborationSnapshots.invitationId, draftId)))
      .limit(1);

    if (!snapshot) {
      return NextResponse.json({ error: "Versi tidak ditemukan." }, { status: 404 });
    }

    try {
      const doc = new Y.Doc();
      Y.applyUpdate(doc, Buffer.from(snapshot.snapshot, "base64"));
      return NextResponse.json({
        version: { id: snapshot.id, revision: snapshot.revision, createdAt: snapshot.createdAt },
        state: extractStateFromYDoc(doc),
      });
    } catch {
      return NextResponse.json({ error: "Versi ini tidak dapat dipulihkan." }, { status: 422 });
    }
  }

  const versions = await db
    .select({
      id: invitationCollaborationSnapshots.id,
      revision: invitationCollaborationSnapshots.revision,
      createdAt: invitationCollaborationSnapshots.createdAt,
      createdBy: invitationCollaborationSnapshots.createdBy,
    })
    .from(invitationCollaborationSnapshots)
    .where(eq(invitationCollaborationSnapshots.invitationId, draftId))
    .orderBy(desc(invitationCollaborationSnapshots.revision), desc(invitationCollaborationSnapshots.createdAt))
    .limit(24);

  return NextResponse.json({ versions });
}
