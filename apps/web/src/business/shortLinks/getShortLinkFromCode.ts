import { config } from "@jailu/web/lib/config"

export const getShortLinkFromCode = (code: string) => `${config.api.baseUrl}/${code}`
