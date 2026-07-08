import { env } from "node:process"

import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

import { loadConfig } from "./src/config"

const config = loadConfig(env)

// The dev server and the built-app preview serve identically — same host/port and the same
// /api proxy — so e2e hits one baseURL whether it runs against the production build (CI) or
// the dev server (local). The only difference: dev transforms on the fly; preview serves dist/.
const serve = {
  host: config.web.host,
  port: config.web.port,
  strictPort: true,
  proxy: {
    "/api": `http://${config.api.host}:${config.api.port}`,
  },
}

export default defineConfig({
  // The tanstackRouter plugin must precede react() (it transforms route files before the JSX pass).
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: serve,
  preview: serve,
})
