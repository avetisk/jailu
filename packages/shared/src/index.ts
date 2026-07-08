import { z } from "zod"

// Flat, single-value schemas shared across the codebase — config env vars, client
// form fields, and API request bodies. Each is one atomic, semantically-identical
// value (a host, a port, a URL, a code, …). Object and request/response contracts do
// NOT live here — those come from the API via Hono RPC (ADR-0001, ADR-0003).

export const hostSchema = z.string().min(1)

export const portSchema = z.coerce.number().int().positive().max(65535)
