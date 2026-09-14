import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { normalizeMetaPixelId, PLATFORM_SETTING_KEYS } from "./constants";

export async function getMetaPixelIdSetting() {
  const [setting] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, PLATFORM_SETTING_KEYS.metaPixelId))
    .limit(1);

  const storedValue = setting?.value as { pixelId?: unknown } | undefined;
  return normalizeMetaPixelId(storedValue?.pixelId);
}
