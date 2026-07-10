import { cacheUrl, getCachedUrl } from "@jailu/api/src/links/cache"
import { findLinkByCode } from "@jailu/api/src/links/repository"

// Cache-aside on the redirect hot path: serve the destination from redis, and on a miss fall back
// to Postgres (the source of truth) and populate the cache. Returns undefined for an unknown code.
export async function resolveUrl(code: string): Promise<string | undefined> {
  const cached = await getCachedUrl(code)
  if (cached !== null) {
    return cached
  }

  const link = await findLinkByCode(code)
  if (link) {
    await cacheUrl(code, link.originalUrl)
  }
  return link?.originalUrl
}
