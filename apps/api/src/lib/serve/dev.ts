import { serve } from "@hono/node-server"
import { app } from "@jailu/api/app"
import { config } from "@jailu/api/lib/config"
import { logger } from "@jailu/api/lib/logger"

serve(
  {
    fetch: app.fetch,
    port: config.api.serve.port,
  },
  (info) => logger.info(`Listening on ${info.address}${info.port}`),
)
