import { z } from "zod"

const DEFAULT_API_PORT = 3000

const configSchema = z
  .object({
    API_PORT: z.coerce.number().int().positive().default(DEFAULT_API_PORT),
  })
  .transform((env) => ({
    api: { port: env.API_PORT },
  }))

export type Config = z.infer<typeof configSchema>

// Validate the snake_case environment once, exposing a nested camelCase config.
// No magic values — and no ENV_VAR keys — elsewhere.
export function loadConfig(source: Record<string, string | undefined>): Config {
  return configSchema.parse(source)
}
