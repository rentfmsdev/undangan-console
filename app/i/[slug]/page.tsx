import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationGuests } from "@/db/schema";
import { buildInvitationSeo, serializeJsonLd } from "@/templates/invitation-seo";
import { PublishedWedding } from "./PublishedWedding";
import { loadPublishedInvitation } from "@/modules/publishing/published-invitation";

export const dynamic = "force-dynamic";

async function getPublicOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? process.env.NEXT_PUBLIC_APP_DOMAIN ?? "undangan.co";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ for?: string; to?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawGuest = resolvedSearchParams.for || resolvedSearchParams.to;
  let cleanGuest: string | undefined;
  if (rawGuest && rawGuest.trim()) {
    try {
      cleanGuest = decodeURIComponent(rawGuest.trim().replace(/\+/g, " "));
    } catch {
      cleanGuest = rawGuest.trim();
    }
  }

  const published = await loadPublishedInvitation(slug);
  if (!published) return { title: "Undangan tidak ditemukan | Undangan Studio", robots: { index: false, follow: false } };
  const origin = await getPublicOrigin();
  const canonical = `${origin}/i/${published.invitation.slug ?? slug}`;
  const seo = buildInvitationSeo(
    published.template,
    published.sections,
    canonical,
    cleanGuest,
    published.invitation.themeId,
    published.invitation.styleOverrides as Record<string, unknown>
  );
  const shareImage = new URL(`/api/share-card/${encodeURIComponent(published.invitation.slug ?? slug)}`, origin);
  if (cleanGuest) shareImage.searchParams.set("for", cleanGuest);
  shareImage.searchParams.set("v", String(published.invitation.updatedAt.getTime()));
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { type: "website", locale: "id_ID", url: canonical, title: seo.title, description: seo.description, siteName: "Undangan Studio", images: [{ url: shareImage.toString(), width: 1200, height: 630, alt: seo.title }] },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [shareImage.toString()] },
  };
}

export default async function PublishedInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ for?: string; to?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedFor = resolvedSearchParams.for || resolvedSearchParams.to;

  const published = await loadPublishedInvitation(slug);
  if (!published) notFound();
  const { invitation, template, sections } = published;

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
    } else {
      verifiedGuestName = cleanFor;
    }
  }

  const origin = await getPublicOrigin();
  const seo = buildInvitationSeo(
    template,
    sections,
    `${origin}/i/${invitation.slug ?? slug}`,
    verifiedGuestName,
    invitation.themeId,
    invitation.styleOverrides as Record<string, unknown>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(seo.jsonLd) }} />
      <PublishedWedding
        templateCode={template.code}
        sections={sections}
        themeId={invitation.themeId}
        invitationId={invitation.id}
        settings={invitation.styleOverrides as Record<string, unknown>}
        verifiedGuestName={verifiedGuestName}
      />
    </>
  );
}
