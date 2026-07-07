import { z } from "zod"

const DEFAULT_HOST = "127.0.0.1"
const DEFAULT_WEB_PORT = 5173
const DEFAULT_API_PORT = 3000

const configSchema = z.object({
  WEB_HOST: z.string().min(1).default(DEFAULT_HOST),
  WEB_PORT: z.coerce.number().int().positive().default(DEFAULT_WEB_PORT),
  API_HOST: z.string().min(1).default(DEFAULT_HOST),
  API_PORT: z.coerce.number().int().positive().default(DEFAULT_API_PORT),
})

export type Config = z.infer<typeof configSchema>

// Validate and cast the environment once, through a schema. No magic values elsewhere.
export function loadConfig(source: Record<string, string | undefined>): Config {
  return configSchema.parse(source)
}
