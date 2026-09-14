import { asc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationSections, invitations } from "@/db/schema";
import { isPublicationExpired } from "@/modules/publishing/retention-policy";
import { getTemplateById } from "@/templates/registry";
import { getTemplateRuntime } from "@/templates/runtime-registry";

export async function loadPublishedInvitation(slug: string) {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(or(eq(invitations.slug, slug), eq(invitations.subdomain, slug)))
    .limit(1);

  if (
    !invitation ||
    !invitation.userId ||
    invitation.status !== "published" ||
    isPublicationExpired(invitation)
  ) {
    return null;
  }

  const template = getTemplateById(invitation.templateId);
  if (!template) return null;

  const records = await db
    .select()
    .from(invitationSections)
    .where(eq(invitationSections.invitationId, invitation.id))
    .orderBy(asc(invitationSections.sectionOrder));
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

  return { invitation, template, sections };
}
