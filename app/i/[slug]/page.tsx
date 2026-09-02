import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationGuests, invitationSections, invitations } from "@/db/schema";
import { getTemplateById } from "@/templates/registry";
import { getTemplateRuntime } from "@/templates/runtime-registry";
import { PublishedWedding } from "./PublishedWedding";

export const dynamic = "force-dynamic";

export default async function PublishedInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ for?: string }>;
}) {
  const { slug } = await params;
  const { for: requestedFor } = await searchParams;

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(or(eq(invitations.slug, slug), eq(invitations.subdomain, slug)))
    .limit(1);

  // Semua publikasi baru wajib mempunyai owner. Record legacy anonim tidak
  // boleh kembali online hanya karena pernah memiliki slug berstatus published.
  if (!invitation || !invitation.userId || invitation.status !== "published") notFound();

  // Validate guest against database for anti-injection!
  let verifiedGuestName: string | undefined;
  if (requestedFor && requestedFor.trim()) {
    let cleanFor = requestedFor.trim();
    try {
      cleanFor = decodeURIComponent(cleanFor.replace(/\+/g, " ")).trim();
    } catch {
      // Fallback to raw if decode fails
    }

    const guestSlug = cleanFor
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 130);

    const [matchedGuest] = await db
      .select()
      .from(invitationGuests)
      .where(
        and(
          eq(invitationGuests.invitationId, invitation.id),
          or(
            eq(invitationGuests.name, cleanFor),
            eq(invitationGuests.slug, guestSlug)
          )
        )
      )
      .limit(1);

    if (matchedGuest) {
      verifiedGuestName = matchedGuest.name;
      // Record opened_at timestamp if not recorded yet
      if (!matchedGuest.openedAt) {
        await db
          .update(invitationGuests)
          .set({ openedAt: new Date() })
          .where(eq(invitationGuests.id, matchedGuest.id))
          .catch(() => {});
      }
    }
  }

  const records = await db
    .select()
    .from(invitationSections)
    .where(eq(invitationSections.invitationId, invitation.id))
    .orderBy(asc(invitationSections.sectionOrder));

  const template = getTemplateById(invitation.templateId);
  if (!template) notFound();
  const runtime = getTemplateRuntime(template.code);
  const sections = runtime.normalizeSections(
    template,
    records.map((section) => ({
      id: section.id,
      type: section.type,
      enabled: Boolean(section.enabled),
      data: section.data as Record<string, unknown>,
    })),
    (type) => `virtual-${type}`
  );

  return (
    <PublishedWedding
      templateCode={template.code}
      sections={sections}
      themeId={invitation.themeId}
      invitationId={invitation.id}
      settings={invitation.styleOverrides as Record<string, unknown>}
      verifiedGuestName={verifiedGuestName}
    />
  );
}
