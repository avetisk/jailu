import { MAX_URL_LENGTH } from "@jailu/shared/src/constants"
import { urlIssue } from "@jailu/shared/src/utils"
import { z } from "zod"

// Flat, single-value schemas shared across the codebase — config env vars, client form
// fields, and API request bodies. Each is one atomic, semantically-identical value (a host,
// a port, a URL, a link code, …). Object and request/response contracts do NOT live here —
// those come from the API via Hono RPC (ADR-0001, ADR-0003). Browser-safe (no Node APIs):
// the client forms import them directly.

export const hostSchema = z.string().min(1)

export const portSchema = z.coerce.number().int().positive().max(65535)

// A short link code is base64url (the URL-safe 64-char alphabet), 3–64 chars. Minted codes
// are LINK_CODE_LENGTH; the range leaves room for custom aliases without a schema change.
export const linkCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{3,64}$/u)

// A URL we accept as shortenable — not any URL. Hardened against the conventional
// abuse/mistake classes (see urlIssue): non-http(s) schemes, embedded credentials,
// self-host loops, localhost, bare IP addresses, and hosts with no public TLD. Never
// fetched server-side (no SSRF), so this is validation + normalization only.
export const shortenableUrlSchema = z
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
