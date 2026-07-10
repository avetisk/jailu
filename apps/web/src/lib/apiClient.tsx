import type { AppType } from "@jailu/api/app"
import { config } from "@jailu/web/lib/config"
import { hc } from "hono/client"

export const apiClient = hc<AppType>(config.api.baseUrl)
