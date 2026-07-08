import { zValidator } from "@hono/zod-validator"
import { linkCodeSchema, urlSchema } from "@jailu/shared"
import { Hono } from "hono"
import { z } from "zod"

import { findLinkByCode, insertLink } from "@/links/repository"

const shortenRequest = z.object({ url: urlSchema })

// The API is the single source of truth for the contract. Routes are chained so
// `AppType` carries end-to-end types to the client via Hono RPC. The redirect lives at
// the root (`/:linkCode`); in production Caddy proxies it and `/api/*` to this server.
export const app = new Hono()
  .get("/api/health", (c) => c.json({ status: "ok" }))
  .post("/api/links", zValidator("json", shortenRequest), async (c) => {
    const { url } = c.req.valid("json")
    const link = await insertLink(url)
    const shortUrl = new URL(`/${link.linkCode}`, c.req.url).href
    return c.json({ linkCode: link.linkCode, url: shortUrl, originalUrl: link.originalUrl }, 201)
  })
  .get("/:linkCode", async (c) => {
    const parsed = linkCodeSchema.safeParse(c.req.param("linkCode"))
    if (!parsed.success) {
      return c.notFound()
    }
    const link = await findLinkByCode(parsed.data)
    if (!link) {
      return c.notFound()
    }
    return c.redirect(link.originalUrl, 302)
  })

export type AppType = typeof app
