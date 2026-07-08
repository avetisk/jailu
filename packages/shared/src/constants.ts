// Shared constant values. One file for now — split by domain if it grows.

// Length of a minted short code. The API mints exactly this many base64url chars; the
// client uses it for validation and display. (Public — re-exported from the barrel.)
export const LINK_CODE_LENGTH = 7

// Named HTTP status codes used by the API and (from Slice 2) the client — the reason
// phrases keep call sites self-documenting (HTTP_STATUS.CREATED beats a bare 201). `as
// const` preserves the literal types Hono's c.json / c.redirect expect. (Public.)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  FOUND: 302,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
} as const

// URL-validation constants — internal to the url utilities + shortenableUrlSchema (not re-exported).
export const MAX_URL_LENGTH = 2048
export const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])
// Refuse to shorten our own links — a jai.lu -> jai.lu hop is a pointless loop.
export const SELF_HOSTS = new Set(["jai.lu", "www.jai.lu"])
// RFC 2606 / 6761 special-use + private TLDs that never resolve on the public internet.
export const NON_PUBLIC_TLDS = new Set([
  "localhost",
  "local",
  "internal",
  "test",
  "invalid",
  "example",
])
export const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/u
// Two-or-more dot-separated labels ending in an alphabetic or punycode TLD.
export const PUBLIC_DOMAIN = /^(?:[a-z0-9-]+\.)+(?:[a-z]{2,}|xn--[a-z0-9]+)$/iu
