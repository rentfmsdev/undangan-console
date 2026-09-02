import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  domainPublishRequests,
  invitationAssets,
  invitationCollaborators,
  invitationGuests,
  invitationSections,
  invitations,
} from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { updateDraftSchema, validateDraftForTemplate } from "@/modules/drafts/validation";

export async function GET(_: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.authorized || !access.draft) {
    return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 401 });
  }

  const sections = await db
    .select()
    .from(invitationSections)
    .where(eq(invitationSections.invitationId, draftId))
    .orderBy(asc(invitationSections.sectionOrder));

  return NextResponse.json({
    draft: access.draft,
    role: access.role,
    isOwner: access.ownedByUser,
    sections: sections.map((section) => ({
      id: section.id,
      type: section.type,
      order: section.sectionOrder,
      enabled: Boolean(section.enabled),
      data: section.data,
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.authorized || !access.draft) {
    return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 401 });
  }

  if (access.role === "viewer") {
    return NextResponse.json(
      { error: "Akun Anda memiliki izin Viewer (hanya melihat) dan tidak dapat mengubah isi draft." },
      { status: 403 }
    );
  }

  const parsed = updateDraftSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Format draft tidak valid." }, { status: 400 });
  const error = validateDraftForTemplate(access.draft.templateId, parsed.data);
  if (error) return NextResponse.json({ error }, { status: 400 });

  await db.transaction(async (tx) => {
    await tx
      .update(invitations)
      .set({
        themeId: parsed.data.themeId,
        styleOverrides: {
          ...(access.draft!.styleOverrides as Record<string, unknown>),
          ...(parsed.data.settings ?? {}),
        },
      })
      .where(eq(invitations.id, draftId));

    await tx.delete(invitationSections).where(eq(invitationSections.invitationId, draftId));
    await tx.insert(invitationSections).values(
      parsed.data.sections.map((section) => ({
        id: section.id,
        invitationId: draftId,
        type: section.type,
        sectionOrder: section.order,
        enabled: section.enabled ? 1 : 0,
        data: section.data,
      }))
    );
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);
  if (!access.authorized || !access.draft) {
    return NextResponse.json({ error: "Draft tidak ditemukan." }, { status: 404 });
  }

  // Strictly only owner can delete the invitation draft!
  if (!access.ownedByUser && access.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya pemilik (owner) undangan yang berhak menghapus draft ini." },
      { status: 403 }
    );
  }

  await db.transaction(async (tx) => {
    // Clean up all related tables to prevent orphaned records in MySQL
    await tx.delete(invitationSections).where(eq(invitationSections.invitationId, draftId));
    await tx.delete(invitationGuests).where(eq(invitationGuests.invitationId, draftId));
    await tx.delete(invitationCollaborators).where(eq(invitationCollaborators.invitationId, draftId));
    await tx.delete(invitationAssets).where(eq(invitationAssets.invitationId, draftId));
    await tx.delete(domainPublishRequests).where(eq(domainPublishRequests.invitationId, draftId));
    await tx.delete(invitations).where(eq(invitations.id, draftId));
  });

  return NextResponse.json({ ok: true, deletedId: draftId });
}

