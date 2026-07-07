import { env } from "node:process"

import { serve } from "@hono/node-server"

import { app } from "./app"
import { logger } from "./lib/logger"

const port = Number(env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`jailu-api listening on http://127.0.0.1:${info.port}`)
})
