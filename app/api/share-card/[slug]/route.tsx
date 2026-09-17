import { NextResponse } from "next/server";
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

function resolveFallbackImageUrl(sections: { type: string; enabled: boolean; data: Record<string, unknown> }[], origin: string) {
  for (const section of sections) {
    if (!section.enabled) continue;
    const single = typeof section.data.imageUrl === "string" ? section.data.imageUrl.trim()
      : typeof section.data.backgroundImageUrl === "string" ? section.data.backgroundImageUrl.trim()
      : "";
    if (single) {
      return single.startsWith("http") ? single : new URL(single, origin).toString();
    }
    if (Array.isArray(section.data.imageUrls)) {
      const gallery = section.data.imageUrls.find((item): item is string => typeof item === "string" && Boolean(item.trim()));
      if (gallery) {
        return gallery.startsWith("http") ? gallery : new URL(gallery, origin).toString();
      }
    }
  }
  return new URL("/assets/fav.png", origin).toString();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const published = await loadPublishedInvitation(slug);
  if (!published) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const origin = url.origin;

  try {
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
  } catch (err) {
    console.error(`[share-card] Error rendering card for slug '${slug}':`, err);
    // Bulletproof fallback: 307 redirect WhatsApp/crawlers directly to the static cover photo
    const fallbackImage = resolveFallbackImageUrl(published.sections, origin);
    return NextResponse.redirect(fallbackImage, 307);
  }
}

