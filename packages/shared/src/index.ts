import { z } from "zod"

export * from "./constants"

// Flat, single-value schemas shared across the codebase — config env vars, client
// form fields, and API request bodies. Each is one atomic, semantically-identical
// value (a host, a port, a URL, a link code, …). Object and request/response contracts
// do NOT live here — those come from the API via Hono RPC (ADR-0001, ADR-0003).
//
// These stay browser-safe (no Node APIs): the client forms import them directly.

export const hostSchema = z.string().min(1)

export const portSchema = z.coerce.number().int().positive().max(65535)

// A short link code is base64url (the URL-safe 64-char alphabet), 3–64 chars. Minted
// codes are LINK_CODE_LENGTH; the range leaves room for custom aliases without a change.
export const linkCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{3,64}$/u)

const MAX_URL_LENGTH = 2048
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])
// Refuse to shorten our own links — a jai.lu -> jai.lu hop is a pointless loop.
const SELF_HOSTS = new Set(["jai.lu", "www.jai.lu"])
// RFC 2606 / 6761 special-use + private TLDs that never resolve on the public internet.
const NON_PUBLIC_TLDS = new Set(["localhost", "local", "internal", "test", "invalid", "example"])
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/u
// Two-or-more dot-separated labels ending in an alphabetic or punycode TLD.
const PUBLIC_DOMAIN = /^(?:[a-z0-9-]+\.)+(?:[a-z]{2,}|xn--[a-z0-9]+)$/iu

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

function urlIssue(value: string): string | null {
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

// A public, shortenable destination. Hardened against the conventional abuse/mistake
// classes: non-http(s) schemes (javascript:/data:/file:), embedded credentials, our own
// host (loops), localhost, bare IP addresses, and hosts with no real public TLD. The URL
// is never fetched server-side (no SSRF), so this is validation + normalization only.
export const urlSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_URL_LENGTH)
  .superRefine((value, ctx) => {
    const issue = urlIssue(value)
    if (issue !== null) {
      ctx.addIssue({ code: "custom", message: issue })
    }
  })
  .transform((value) => new URL(value).href)
