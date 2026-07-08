import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// Web unit tests cover pure logic only (i18n catalogs, the `cn` helper). The UI, routing, and
// RPC wiring are exercised by the Playwright e2e suite, not vitest — mirrored in the coverage
// `exclude` below (same philosophy as apps/api). `include` is scoped to test/ so the Playwright
// specs under e2e/ (also *.spec.ts) never get picked up by vitest.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // UI (e2e-covered), bootstrap/wiring, generated, config, and type-only modules — no unit
      // logic to measure. Everything with logic (i18n catalogs, cn) stays at 100%.
      exclude: [
        "src/main.tsx",
        "src/router.tsx",
        "src/routeTree.gen.ts",
        "src/config.ts",
        "src/i18n/index.ts",
        "src/lib/rpc.ts",
        "src/routes/**",
        "src/components/**",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
