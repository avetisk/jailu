import type { AppType } from "@jailu/api/src/app"
import { hc } from "hono/client"

// Typed RPC client for the API (ADR-0003). Same origin: in prod Caddy proxies /api/* and
// /:code, in dev vite proxies /api — so the base is the current origin. Typed end-to-end
// against the server's AppType; the shorten form (Slice 2d) is its first caller.
export const client = hc<AppType>(window.location.origin)
