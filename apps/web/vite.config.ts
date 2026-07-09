import { env } from "node:process"

import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

import { loadConfig } from "./src/config"

const config = loadConfig(env)

const apiTarget = `http://${config.api.host}:${config.api.port}`

// The dev server and the built-app preview serve identically — same host/port and the same
// proxy — so e2e hits one baseURL whether it runs against the production build (CI) or the dev
// server (local). The only difference: dev transforms on the fly; preview serves dist/.
const serve = {
  host: config.web.host,
  port: config.web.port,
  strictPort: true,
  proxy: {
    "/api": apiTarget,
    // `/:code` is a redirect the API owns (a 302), not a SPA route — in prod Caddy routes it to
    // Hono (ADR-0002). Vite proxies only /api, so a minted link would otherwise load the SPA in
    // dev; forward bare, single-segment, code-shaped paths (linkCodeSchema) to the API so short
    // links redirect here too. A `^`-prefixed key is a RegExp; `$` keeps it to one segment, so
    // vite's own assets (`/src/…`, `/@vite/…`, `/assets/…`, dotted files) never match. Future
    // top-level SPA routes will need a reserved prefix — the same constraint prod's Caddy has.
    "^/[A-Za-z0-9_-]{3,64}$": { target: apiTarget, changeOrigin: true },
  },
}

export default defineConfig({
  // The tanstackRouter plugin must precede react() (it transforms route files before the JSX pass).
  // Its tmpDir sits inside the (bind-mounted) src so the generator's temp -> routeTree.gen.ts rename
  // stays on one filesystem: a cross-device rename across the docker bind mount fails with EXDEV.
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: false, tmpDir: "src/.tanstack" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: serve,
  preview: serve,
})
