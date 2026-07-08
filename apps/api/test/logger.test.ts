import { logger } from "@jailu/api/src/lib/logger"
import { describe, expect, it } from "vitest"

describe("logger", () => {
  it("exposes a configured tslog instance", () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe("function")
  })
})
