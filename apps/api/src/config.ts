import { hostSchema, portSchema } from "@jailu/shared"
import { z } from "zod"

const configSchema = z
  .object({
    API_HOST: hostSchema,
    API_PORT: portSchema,
    DATABASE_URL: z.string().min(1),
  })
  .transform((env) => ({
    api: { host: env.API_HOST, port: env.API_PORT },
    database: { url: env.DATABASE_URL },
  }))

export type Config = z.infer<typeof configSchema>

// Validate the required snake_case environment once, exposing a nested camelCase
// config. There are no defaults: a missing or invalid variable fails loud here rather
// than silently falling back to a magic value. Suggested values live in .env.example.
export function loadConfig(source: Record<string, string | undefined>): Config {
  return configSchema.parse(source)
}
