import { NextResponse } from "next/server";
import { getMetaPixelIdSetting } from "@/modules/platform-settings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const metaPixelId = await getMetaPixelIdSetting().catch(() => null);
  return NextResponse.json(
    { analytics: { metaPixelId } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
