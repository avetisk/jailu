import "@/env"
import { env } from "node:process"

import { serve } from "@hono/node-server"

import { app } from "@/app"
import { loadConfig } from "@/config"
import { logger } from "@/lib/logger"

const config = loadConfig(env)

serve({ fetch: app.fetch, hostname: config.api.host, port: config.api.port }, () => {
  logger.info(`listening on http://${config.api.host}:${config.api.port}`)
})
