import { z } from "zod"

const DEFAULT_API_PORT = 3000

const configSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(DEFAULT_API_PORT),
})

export type Config = z.infer<typeof configSchema>

// Validate and cast the environment once, through a schema. No magic values elsewhere.
export function loadConfig(source: Record<string, string | undefined>): Config {
  return configSchema.parse(source)
}
