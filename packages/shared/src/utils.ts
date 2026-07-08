import {
  ALLOWED_PROTOCOLS,
  IPV4,
  NON_PUBLIC_TLDS,
  PUBLIC_DOMAIN,
  SELF_HOSTS,
} from "@jailu/shared/src/constants"
import { URL_ERROR, type UrlErrorCode } from "@jailu/shared/src/errors"

// URL-validation helpers behind shortenableUrlSchema, kept out of the schema file (SoC). Browser-safe
// (WHATWG URL only, no Node APIs). Grouped by domain here as they grow.

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isLocalhost(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost")
}

function isIpLiteral(host: string): boolean {
  // IPv6 hostnames keep their brackets ("[::1]"); WHATWG URL normalizes every IPv4
  // form (decimal, hex, integer) to dotted-quad, which IPV4 then catches.
  return host.startsWith("[") || IPV4.test(host)
}

function hasPublicTld(host: string): boolean {
  if (!PUBLIC_DOMAIN.test(host)) {
    return false
  }
  const tld = host.slice(host.lastIndexOf(".") + 1)
  return !NON_PUBLIC_TLDS.has(tld)
}

function hostIssue(host: string): UrlErrorCode | null {
  if (SELF_HOSTS.has(host)) {
    return URL_ERROR.SELF_HOST
  }
  if (isLocalhost(host)) {
    return URL_ERROR.LOCALHOST
  }
  if (isIpLiteral(host)) {
    return URL_ERROR.IP_HOST
  }
  if (!hasPublicTld(host)) {
    return URL_ERROR.NO_PUBLIC_TLD
  }
  return null
}

// Returns the stable error code for why the value is not a public, shortenable http(s) URL,
// or null when it is fine. The caller localizes the code; this layer never emits prose.
export function urlIssue(value: string): UrlErrorCode | null {
  const url = parseUrl(value)
  if (url === null) {
    return URL_ERROR.MALFORMED
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return URL_ERROR.SCHEME_NOT_ALLOWED
  }
  if (url.username !== "" || url.password !== "") {
    return URL_ERROR.CREDENTIALS_PRESENT
  }
  return hostIssue(url.hostname.toLowerCase())
}
