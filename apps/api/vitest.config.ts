import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Entrypoint + env bootstrap: I/O wiring (serve, .env file load), not logic —
      // exercised by running the app, not unit-tested. Everything else stays at 100%.
      exclude: ["src/index.ts", "src/env.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
