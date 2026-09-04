import "server-only";

import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import { getPublishRetentionDays } from "./retention-policy";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Releases expired public identifiers without deleting invitations or any
 * related sections, guests, wishes, collaboration data, or uploaded assets.
 */
export async function releaseExpiredPublications(now = new Date()) {
  const cutoff = new Date(now.getTime() - getPublishRetentionDays() * MILLISECONDS_PER_DAY);

  await db
    .update(invitations)
    .set({
      status: "archived",
      slug: null,
      subdomain: null,
    })
    .where(
      and(
        eq(invitations.status, "published"),
        inArray(invitations.publishMode, ["path", "subdomain"]),
        or(isNull(invitations.publishedAt), lte(invitations.publishedAt, cutoff)),
      ),
    );
}
