import { ImageResponse } from "next/og";
import type { InvitationShareData } from "@/modules/share-card/invitation-share-data";
import { renderShareCard } from "@/modules/share-card/render-share-card";
import { getShareCardFonts } from "@/modules/share-card/fonts";
import { resolveShareCardImage } from "@/modules/share-card/image-resolver";

export const dynamic = "force-dynamic";

function isShareData(value: unknown): value is InvitationShareData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.subject === "string"
    && typeof candidate.guestName === "string"
    && typeof candidate.templateId === "string"
    && typeof candidate.cardStyle === "object"
    && typeof candidate.colors === "object";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { data?: unknown } | null;
  if (!isShareData(payload?.data)) {
    return new Response("Invalid share card data", { status: 400 });
  }

  const data = payload.data;
  if (data.cardStyle.imageUrl) {
    data.cardStyle.imageUrl = await resolveShareCardImage(data.cardStyle.imageUrl);
  }

  const fonts = await getShareCardFonts();

  return new ImageResponse(renderShareCard(data), {
    width: 1200,
    height: 630,
    fonts,
  });
}
