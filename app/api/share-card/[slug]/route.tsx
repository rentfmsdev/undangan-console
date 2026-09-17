import { ImageResponse } from "next/og";
import { loadPublishedInvitation } from "@/modules/publishing/published-invitation";
import { buildInvitationShareData } from "@/modules/share-card/invitation-share-data";
import { renderShareCard } from "@/modules/share-card/render-share-card";
import { getShareCardFonts } from "@/modules/share-card/fonts";
import { resolveShareCardImage } from "@/modules/share-card/image-resolver";

export const dynamic = "force-dynamic";

function readGuestName(value: string | null) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).trim() || undefined;
  } catch {
    return value.trim() || undefined;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const published = await loadPublishedInvitation(slug);
  if (!published) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const shareData = buildInvitationShareData({
    template: published.template,
    sections: published.sections,
    themeId: published.invitation.themeId,
    styleOverrides: published.invitation.styleOverrides as Record<string, unknown>,
    guestName: readGuestName(url.searchParams.get("for") ?? url.searchParams.get("to")),
  });

  if (shareData.cardStyle.imageUrl) {
    shareData.cardStyle.imageUrl = await resolveShareCardImage(shareData.cardStyle.imageUrl);
  }

  const fonts = await getShareCardFonts();

  const response = new ImageResponse(renderShareCard(shareData), {
    width: 1200,
    height: 630,
    fonts,
  });
  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}
