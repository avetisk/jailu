import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // I/O wiring and type-only / migration modules: exercised by running the app or
      // applying migrations, not unit-tested. Everything with logic stays at 100%.
      exclude: [
        "src/index.ts",
        "src/env.ts",
        "src/db/index.ts",
        "src/db/schema.ts",
        "src/db/migrator.ts",
        "src/db/migrate.ts",
        "src/db/migrations/**",
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
