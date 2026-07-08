import { ALLOWED_PROTOCOLS, IPV4, NON_PUBLIC_TLDS, PUBLIC_DOMAIN, SELF_HOSTS } from "./constants"

// URL-validation helpers behind urlSchema, kept out of the schema file (SoC). Browser-safe
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

function hostIssue(host: string): string | null {
  if (SELF_HOSTS.has(host)) {
    return "cannot shorten a jai.lu link"
  }
  if (isLocalhost(host)) {
    return "localhost is not allowed"
  }
  if (isIpLiteral(host)) {
    return "IP-address hosts are not allowed"
  }
  if (!hasPublicTld(host)) {
    return "a public domain with a valid TLD is required"
  }
  return null
}

// Returns a human-readable reason the value is not a public, shortenable http(s) URL, or
// null when it is fine.
export function urlIssue(value: string): string | null {
  const url = parseUrl(value)
  if (url === null) {
    return "must be a valid absolute URL"
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return "only http and https URLs are allowed"
  }
  if (url.username !== "" || url.password !== "") {
    return "credentials in the URL are not allowed"
  }
  return hostIssue(url.hostname.toLowerCase())
}
