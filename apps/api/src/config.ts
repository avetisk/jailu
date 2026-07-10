import { hostSchema, portSchema } from "@jailu/shared"
import { z } from "zod"

const configSchema = z
  .object({
    API_HOST: hostSchema,
    API_PORT: portSchema,
    DATABASE_URL: z.string().min(1),
    // The public origin short links are built against. The link code is appended to this
    // (never derived from the request URL), so a reverse proxy's Host header can't steer the
    // minted link — inject it, don't trust external input (PR #8 review). http(s) only.
    PUBLIC_BASE_URL: z.url({ protocol: /^https?$/u }),
    // The redis connection string for the redirect cache (and Slice 3b rate limiting). The cache
    // is a disposable accelerator, but its URL is fail-loud config like the rest — no in-code
    // default. redis/rediss only.
    REDIS_URL: z.url({ protocol: /^rediss?$/u }),
  })
  .transform((env) => ({
    api: { host: env.API_HOST, port: env.API_PORT },
    database: { url: env.DATABASE_URL },
    redis: { url: env.REDIS_URL },
    publicBaseUrl: env.PUBLIC_BASE_URL,
  }))

export type Config = z.infer<typeof configSchema>

// Validate the required snake_case environment once, exposing a nested camelCase
// config. There are no defaults: a missing or invalid variable fails loud here rather
// than silently falling back to a magic value. Suggested values live in .env.example.
export function loadConfig(source: Record<string, string | undefined>): Config {
  return configSchema.parse(source)
}
