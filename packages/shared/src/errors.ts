// Stable validation error codes that cross the client/API boundary. A shared schema emits
// one of these as its zod issue `message` — deliberately `message`, because it is the only
// field that survives BOTH consumers: standard-schema (how @tanstack/react-form reads a
// schema) exposes only `{ message, path }`, and @hono/zod-validator sees the full error.
// Each side maps a code to human text on its own: the web app via its i18n catalogs, the
// API not at all — it returns the code verbatim (ADR-0007). Shared owns codes, never prose.
export const URL_ERROR = {
  EMPTY: "url.empty",
  TOO_LONG: "url.too_long",
  MALFORMED: "url.malformed",
  SCHEME_NOT_ALLOWED: "url.scheme_not_allowed",
  CREDENTIALS_PRESENT: "url.credentials_present",
  SELF_HOST: "url.self_host",
  LOCALHOST: "url.localhost",
  IP_HOST: "url.ip_host",
  NO_PUBLIC_TLD: "url.no_public_tld",
} as const

export type UrlErrorCode = (typeof URL_ERROR)[keyof typeof URL_ERROR]
