import { createShortLinksRoute } from "@jailu/api/business/shortLinks/createShortLinksRoute"
import { config } from "@jailu/api/lib/config"
import { db } from "@jailu/api/lib/db/instance"
import type { Database } from "@jailu/api/lib/db/schema"
import { Hono } from "hono"
import { cors } from "hono/cors"
import type { Kysely } from "kysely"

const routeOptions = {
  db,
}

export const app = new Hono()
  .use(cors({ origin: config.web.origin }))
  .get("/ping", (c) => c.json({ status: "pong" }))
  .route("/", createShortLinksRoute(routeOptions))

export type AppType = typeof app

export interface RouteOptions {
  db: Kysely<Database>
}
