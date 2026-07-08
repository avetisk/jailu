import { zValidator } from "@hono/zod-validator"
import { findLinkByCode, insertLink } from "@jailu/api/src/links/repository"
import { HTTP_STATUS, linkCodeSchema, shortenableUrlSchema } from "@jailu/shared"
import { Hono } from "hono"
import { z } from "zod"

const shortenRequest = z.object({ url: shortenableUrlSchema })

// The API is the single source of truth for the contract. Routes are chained so
// `AppType` carries end-to-end types to the client via Hono RPC. The redirect lives at
// the root (`/:linkCode`); in production Caddy proxies it and `/api/*` to this server.
export const app = new Hono()
  .get("/api/health", (c) => c.json({ status: "ok" }))
  .post("/api/links", zValidator("json", shortenRequest), async (c) => {
    const { url } = c.req.valid("json")
    const link = await insertLink(url)
    const shortUrl = new URL(`/${link.linkCode}`, c.req.url).href
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
    const link = await findLinkByCode(parsed.data)
    if (!link) {
      return c.notFound()
    }
    return c.redirect(link.originalUrl, HTTP_STATUS.FOUND)
  })

export type AppType = typeof app
