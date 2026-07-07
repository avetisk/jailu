import { z } from "zod"

const DEFAULT_HOST = "127.0.0.1"
const DEFAULT_WEB_PORT = 5173
const DEFAULT_API_PORT = 3000

const configSchema = z
  .object({
    WEB_HOST: z.string().min(1).default(DEFAULT_HOST),
    WEB_PORT: z.coerce.number().int().positive().default(DEFAULT_WEB_PORT),
    API_HOST: z.string().min(1).default(DEFAULT_HOST),
    API_PORT: z.coerce.number().int().positive().default(DEFAULT_API_PORT),
  })
  .transform((env) => ({
    web: { host: env.WEB_HOST, port: env.WEB_PORT },
    api: { host: env.API_HOST, port: env.API_PORT },
  }))

export type Config = z.infer<typeof configSchema>

// Validate the snake_case environment once, exposing a nested camelCase config.
// No magic values — and no ENV_VAR keys — elsewhere.
export function loadConfig(source: Record<string, string | undefined>): Config {
  return configSchema.parse(source)
}
