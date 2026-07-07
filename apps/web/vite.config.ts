import { env } from "node:process"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

import { loadConfig } from "./src/config"

const config = loadConfig(env)

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: config.web.host,
    port: config.web.port,
    strictPort: true,
    proxy: {
      "/api": `http://${config.api.host}:${config.api.port}`,
    },
  },
})
