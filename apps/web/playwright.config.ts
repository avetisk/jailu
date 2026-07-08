import { env } from "node:process"

import { defineConfig } from "@playwright/test"

import { loadConfig } from "./src/config"

const config = loadConfig(env)
const baseURL = `http://${config.web.host}:${config.web.port}`

// CI runs e2e against the production build (`vite build` in the CI 'build' step, then
// `vite preview`) — the static artifact we actually ship behind Caddy, not the dev server.
// Locally, dev is kept for fast iteration and server reuse.
const isCI = Boolean(env.CI)

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
  },
  webServer: {
    command: isCI ? "pnpm preview" : "pnpm dev",
    url: baseURL,
    reuseExistingServer: !isCI,
  },
})
