import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let callsSinceCleanup = 0;

function cleanupExpiredBuckets(now: number) {
  callsSinceCleanup += 1;
  if (callsSinceCleanup < 100 && buckets.size < 10_000) return;
  callsSinceCleanup = 0;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getRequestClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const addresses = forwarded.split(",").map((value) => value.trim()).filter(Boolean);
    if (addresses.length) return addresses.at(-1)!;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Fixed-window limiter for the single web instance used by docker-compose.
 * It intentionally fails closed only for the abusive request, without adding
 * an external dependency to public RSVP submissions.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  cleanupExpiredBuckets(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= 10_000) {
      const oldestKey = buckets.keys().next().value as string | undefined;
      if (oldestKey) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
