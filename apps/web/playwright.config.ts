import { env } from "node:process"

import { defineConfig } from "@playwright/test"

import { loadConfig } from "./src/config"

const config = loadConfig(env)
const baseURL = `http://${config.WEB_HOST}:${config.WEB_PORT}`

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
  },
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: true,
  },
})
