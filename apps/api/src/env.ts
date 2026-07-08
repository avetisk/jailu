import { existsSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"

// Local-dev convenience: load the repo-root .env into process.env if it exists, so
// `pnpm dev` and the tests pick up the values a developer copied from .env.example.
// In CI and production the variables come from the real environment. Nothing is
// defaulted — whatever is still missing fails loud in loadConfig (see config.ts).
const envFile = join(import.meta.dirname, "../../../.env")

if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}
