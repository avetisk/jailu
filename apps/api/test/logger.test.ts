import { describe, expect, it } from "vitest"

import { logger } from "../src/lib/logger"

describe("logger", () => {
  it("exposes a configured tslog instance", () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe("function")
  })
})
