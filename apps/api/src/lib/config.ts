import { env } from "node:process"

import { dbNameSchema, portSchema } from "@jailu/common/schemas"
import z from "zod"

export const config = z
  .object({
    API_SERVE_PORT: portSchema,
    DB_POOL_DATABASE: dbNameSchema,
    DB_POOL_HOST: z.hostname(),
    DB_POOL_PASSWORD: z.string(),
    DB_POOL_PORT: portSchema,
    DB_POOL_USER: z.string(),
    WEB_ORIGIN: z.url(),
    WEB_URLS_NOT_FOUND: z.url(),
  })
  .transform(
    ({
      API_SERVE_PORT,
      DB_POOL_DATABASE,
      DB_POOL_HOST,
      DB_POOL_PASSWORD,
      DB_POOL_PORT,
      DB_POOL_USER,
      WEB_ORIGIN,
      WEB_URLS_NOT_FOUND,
    }) => ({
      api: {
        serve: {
          port: API_SERVE_PORT,
        },
      },
      db: {
        pool: {
          database: DB_POOL_DATABASE,
          host: DB_POOL_HOST,
          password: DB_POOL_PASSWORD,
          port: DB_POOL_PORT,
          user: DB_POOL_USER,
        },
      },
      web: {
        origin: WEB_ORIGIN,
        urls: {
          notFound: WEB_URLS_NOT_FOUND,
        },
      },
    }),
  )
  .parse(env)
