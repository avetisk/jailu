import { zValidator } from "@hono/zod-validator"
import type { RouteOptions } from "@jailu/api/app"
import { genShortLinkCode } from "@jailu/api/business/shortLinks/generators/genShortLinkCode"
import { config } from "@jailu/api/lib/config"
import { HTTP_CODES } from "@jailu/common/constants"
import { shortenableUrlSchema, shortLinkCodeSchema } from "@jailu/common/schemas"
import { Hono } from "hono"
import { z } from "zod"

export const createShortLinksRoute = ({ db }: RouteOptions) =>
  new Hono()
    .route(
      "/shortLinks",
      new Hono().post(
        "/",
        zValidator(
          "json",
          z.object({
            originalUrl: shortenableUrlSchema,
          }),
        ),
        async (c) => {
          const { originalUrl } = c.req.valid("json")
          const shortLink = await db
            .insertInto("shortLinks")
            .values({
              originalUrl,
              code: genShortLinkCode(),
            })
            .returning("shortLinks.code")
            .executeTakeFirstOrThrow()

          return c.json(shortLink, HTTP_CODES.CREATED)
        },
      ),
    )
    // Always keep this route last! We don't want the wildcard to take over other paths.
    .get(
      "/:shortLinkCode",
      zValidator(
        "param",
        z.object({
          shortLinkCode: shortLinkCodeSchema,
        }),
      ),
      async (c) => {
        const { shortLinkCode } = c.req.valid("param")
        const shortLink = await db
          .selectFrom("shortLinks")
          .select("originalUrl")
          .where("code", "=", shortLinkCode)
          .executeTakeFirst()

        return c.redirect(shortLink?.originalUrl ?? config.web.urls.notFound, HTTP_CODES.FOUND)
      },
    )
