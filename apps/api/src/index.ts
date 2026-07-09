import { env } from "node:process"

import { serve } from "@hono/node-server"
import { createApp } from "@jailu/api/src/app"
import { loadConfig } from "@jailu/api/src/config"
import { logger } from "@jailu/api/src/lib/logger"

const config = loadConfig(env)
const app = createApp({ publicBaseUrl: config.publicBaseUrl })

serve({ fetch: app.fetch, hostname: config.api.host, port: config.api.port }, () => {
  logger.info(`listening on http://${config.api.host}:${config.api.port}`)
})
