interface Bucket {
  count: number
  resetAt: number
}

/**
 * Fixed-window in-memory rate limiter. Process-local (per server instance), which
 * is enough to blunt accidental/abusive bursts against the paid AI endpoint.
 * For multi-instance enforcement swap the store for Upstash/Redis later.
 */
const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): { allowed: boolean; retryAfterSec: number } {
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true, retryAfterSec: 0 }
}
