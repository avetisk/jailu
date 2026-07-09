import { zValidator } from "@hono/zod-validator"
import { insertLink } from "@jailu/api/src/links/repository"
import { resolveTarget } from "@jailu/api/src/links/resolve-target"
import { HTTP_STATUS, linkCodeSchema, shortenableUrlSchema } from "@jailu/shared"
import { Hono } from "hono"
import { z } from "zod"

const shortenRequest = z.object({ url: shortenableUrlSchema })

type AppOptions = { publicBaseUrl: string }

// The API is the single source of truth for the contract. Routes are chained so `AppType`
// carries end-to-end types to the client via Hono RPC. The redirect lives at the root
// (`/:linkCode`) and resolves through a redis cache-aside (`links/resolve-target`); in production
// Caddy proxies it and `/api/*` to this server. The short URL is
// built from `options.publicBaseUrl` (injected from config), never from `c.req.url`: the minted
// link is a value we own, so a proxy's Host header can't poison it (PR #8 review).
export function createApp(options: AppOptions) {
  return new Hono()
    .get("/api/health", (c) => c.json({ status: "ok" }))
    .post("/api/links", zValidator("json", shortenRequest), async (c) => {
      const { url } = c.req.valid("json")
      const link = await insertLink(url)
      const shortUrl = new URL(`/${link.linkCode}`, options.publicBaseUrl).href
      return c.json(
        { linkCode: link.linkCode, url: shortUrl, originalUrl: link.originalUrl },
        HTTP_STATUS.CREATED,
      )
    })
    .get("/:linkCode", async (c) => {
      const parsed = linkCodeSchema.safeParse(c.req.param("linkCode"))
      if (!parsed.success) {
        return c.notFound()
      }
      const target = await resolveTarget(parsed.data)
      if (!target) {
        return c.notFound()
      }
      return c.redirect(target, HTTP_STATUS.FOUND)
    })
}

export type AppType = ReturnType<typeof createApp>
