import { describe, expect, it } from "vitest"

import { loadConfig } from "@/config"

describe("loadConfig", () => {
  it("defaults and coerces the API port", () => {
    expect(loadConfig({}).API_PORT).toBe(3000)
    expect(loadConfig({ API_PORT: "8080" }).API_PORT).toBe(8080)
  })

  it("rejects an invalid port", () => {
    expect(() => loadConfig({ API_PORT: "-1" })).toThrow()
  })
})
