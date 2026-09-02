import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitationSections, invitations } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";
import { createEditToken, createRecoveryCode, editCookieName, hashSecret } from "@/modules/anonymous-access/token";
import { createDraftSchema } from "@/modules/drafts/validation";
import { getTemplateByCode, getTemplateById, getTemplateCatalogItem } from "@/templates/registry";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const templateCode = new URL(request.url).searchParams.get("templateCode")?.trim().toLowerCase();
  const template = templateCode ? getTemplateByCode(templateCode) : null;

  // 1. Owned drafts
  const ownedRecords = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateId: invitations.templateId,
      themeId: invitations.themeId,
      status: invitations.status,
      slug: invitations.slug,
      subdomain: invitations.subdomain,
      createdAt: invitations.createdAt,
      updatedAt: invitations.updatedAt,
    })
    .from(invitations)
    .where(
      template
        ? and(eq(invitations.userId, user.id), eq(invitations.templateId, template.id))
        : eq(invitations.userId, user.id)
    )
    .orderBy(desc(invitations.updatedAt));

  // 2. Collaborated drafts
  const collabRecords = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateId: invitations.templateId,
      themeId: invitations.themeId,
      status: invitations.status,
      slug: invitations.slug,
      subdomain: invitations.subdomain,
      createdAt: invitations.createdAt,
      updatedAt: invitations.updatedAt,
      collabRole: invitationCollaborators.role,
    })
    .from(invitationCollaborators)
    .innerJoin(invitations, eq(invitationCollaborators.invitationId, invitations.id))
    .where(
      and(
        or(
          eq(invitationCollaborators.userId, user.id),
          eq(invitationCollaborators.email, user.email)
        ),
        eq(invitationCollaborators.status, "accepted"),
        template ? eq(invitations.templateId, template.id) : undefined
      )
    )
    .orderBy(desc(invitations.updatedAt));

  const allDraftsMap = new Map<string, typeof ownedRecords[0] & { isCollaborator?: boolean; collabRole?: string }>();

  for (const record of ownedRecords) {
    allDraftsMap.set(record.id, { ...record, isCollaborator: false });
  }

  for (const record of collabRecords) {
    if (!allDraftsMap.has(record.id)) {
      allDraftsMap.set(record.id, {
        id: record.id,
        title: record.title,
        templateId: record.templateId,
        themeId: record.themeId,
        status: record.status,
        slug: record.slug,
        subdomain: record.subdomain,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        isCollaborator: true,
        collabRole: record.collabRole,
      });
    }
  }

  const enrichedDrafts = Array.from(allDraftsMap.values()).map((record) => {
    const kit = getTemplateById(record.templateId);
    const catalog = getTemplateCatalogItem(record.templateId) ?? (kit ? getTemplateCatalogItem(kit.code) : undefined);
    const code = kit?.code ?? catalog?.code ?? "hjydg";
    const name = kit?.name ?? catalog?.name ?? "Wedding Elegance";
    const coverImage = catalog?.covers?.[0] ?? "/thumb/wedding-elegance.png";
    const category = catalog?.categoryLabel ?? "Pernikahan";

    return {
      ...record,
      templateCode: code,
      templateName: name,
      coverImage,
      category,
    };
  });

  return NextResponse.json({ drafts: enrichedDrafts });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk menyimpan undangan." }, { status: 401 });
  const parsed = createDraftSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Kode template tidak valid." }, { status: 400 });

  const template = getTemplateByCode(parsed.data.templateCode);
  if (!template) return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });

  const draftId = randomUUID();
  const editToken = createEditToken();
  const recoveryCode = createRecoveryCode();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(invitations).values({
      id: draftId,
      userId: user.id,
      title: parsed.data.title ?? `${template.name} - ${new Date().toLocaleDateString("id-ID")}`,
      editTokenHash: hashSecret(editToken),
      recoveryCodeHash: hashSecret(recoveryCode),
      templateId: template.id,
      templateVersion: template.version,
      themeId: template.themes[0].id,
      styleOverrides: {},
    });
    await tx.insert(invitationSections).values(template.defaultSections.flatMap((type, order) => {
      const section = template.sections.find((item) => item.type === type);
      return section ? [{ id: randomUUID(), invitationId: draftId, type: section.type, sectionOrder: order, enabled: 1, data: section.defaultData, createdAt: now, updatedAt: now }] : [];
    }));
  });

  const response = NextResponse.json({ draftId, recoveryCode, themeId: template.themes[0].id });
  response.cookies.set(editCookieName(draftId), editToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return response;
}
