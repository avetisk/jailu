import { env } from "node:process"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

import { loadConfig } from "./src/config"

const config = loadConfig(env)

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: config.WEB_HOST,
    port: config.WEB_PORT,
    strictPort: true,
    proxy: {
      "/api": `http://${config.API_HOST}:${config.API_PORT}`,
    },
  },
})
