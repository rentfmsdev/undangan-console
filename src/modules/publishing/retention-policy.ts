const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 3650;

export type RetainedPublication = {
  status: string | null;
  publishMode: string | null;
  publishedAt: Date | string | null;
};

export function getPublishRetentionDays(rawValue = process.env.PUBLISH_RETENTION_DAYS) {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_RETENTION_DAYS) {
    return DEFAULT_RETENTION_DAYS;
  }
  return parsed;
}

export function getPublicationExpiresAt(
  publishedAt: Date | string | null,
  retentionDays = getPublishRetentionDays(),
) {
  if (!publishedAt) return null;
  const publishedTime = publishedAt instanceof Date ? publishedAt.getTime() : new Date(publishedAt).getTime();
  if (!Number.isFinite(publishedTime)) return null;
  return new Date(publishedTime + retentionDays * MILLISECONDS_PER_DAY);
}

export function isPublicationExpired(
  publication: RetainedPublication,
  now = new Date(),
  retentionDays = getPublishRetentionDays(),
) {
  if (publication.status !== "published") return false;
  if (publication.publishMode !== "path" && publication.publishMode !== "subdomain") return false;
  const expiresAt = getPublicationExpiresAt(publication.publishedAt, retentionDays);
  return !expiresAt || expiresAt.getTime() <= now.getTime();
}
