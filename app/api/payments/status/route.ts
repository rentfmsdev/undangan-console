import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import { buildInvitationUrl } from "@/lib/app-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const draftId = searchParams.get("draftId");
  if (!draftId) {
    return NextResponse.json({ error: "draftId parameter required" }, { status: 400 });
  }

  const [draft] = await db
    .select({
      id: invitations.id,
      status: invitations.status,
      publishMode: invitations.publishMode,
      slug: invitations.slug,
      subdomain: invitations.subdomain,
      styleOverrides: invitations.styleOverrides,
    })
    .from(invitations)
    .where(eq(invitations.id, draftId))
    .limit(1);

  if (!draft) {
    return NextResponse.json({ error: "Draft tidak ditemukan" }, { status: 404 });
  }

  const overrides = (draft.styleOverrides as Record<string, unknown>) || {};
  const isPaid = draft.status === "published" || Boolean(overrides.payment);
  const liveUrl = draft.slug ? buildInvitationUrl(draft.slug) : null;

  return NextResponse.json({
    paid: isPaid,
    status: draft.status,
    publishMode: draft.publishMode,
    slug: draft.slug,
    subdomain: draft.subdomain,
    url: liveUrl,
    payment: overrides.payment ?? null,
  });
}
