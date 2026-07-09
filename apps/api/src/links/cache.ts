import { redis } from "@jailu/api/src/redis"

// The redirect cache: `code -> originalUrl`, key-namespaced. Destinations are immutable
// (ADR-0004) and there is no disable/expiry yet (Slice 6), so a cached URL can never go stale —
// a sliding TTL is the only bound needed. Reads refresh the TTL (GETEX) so hot links stay warm;
// the dev-stack redis caps total memory with maxmemory + allkeys-lru eviction.
const KEY_PREFIX = "link:"

// One hour, reset on every read. Long enough to absorb traffic bursts, short enough that a link
// that stops being hit ages out on its own. Rationale in ADR-0010.
export const LINK_CACHE_TTL_SECONDS = 3600

const cacheKey = (code: string): string => `${KEY_PREFIX}${code}`

// Read the cached URL for a code, refreshing its TTL (sliding window). null when not cached.
export function getCachedUrl(code: string): Promise<string | null> {
  return redis.getex(cacheKey(code), "EX", LINK_CACHE_TTL_SECONDS)
}

// Populate the cache after a Postgres hit.
export function cacheUrl(code: string, originalUrl: string): Promise<"OK"> {
  return redis.set(cacheKey(code), originalUrl, "EX", LINK_CACHE_TTL_SECONDS)
}
