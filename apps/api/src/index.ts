import { env } from "node:process"

import { serve } from "@hono/node-server"

import { app } from "@/app"
import { loadConfig } from "@/config"
import { logger } from "@/lib/logger"

const config = loadConfig(env)

serve({ fetch: app.fetch, port: config.api.port }, (info) => {
  logger.info(`listening on http://127.0.0.1:${info.port}`)
})
