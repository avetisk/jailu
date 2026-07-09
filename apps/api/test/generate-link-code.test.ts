import { generateLinkCode } from "@jailu/api/src/links/generate-link-code"
import { LINK_CODE_LENGTH, linkCodeSchema } from "@jailu/shared"
import { describe, expect, it } from "vitest"

describe("generateLinkCode", () => {
  it("mints a base64url code of the expected length", () => {
    const code = generateLinkCode()
    expect(code).toHaveLength(LINK_CODE_LENGTH)
    expect(linkCodeSchema.safeParse(code).success).toBe(true)
  })

  it("is effectively unique across many draws (non-enumerable)", () => {
    const codes = Array.from({ length: 500 }, () => generateLinkCode())
    for (const code of codes) {
      expect(code).toMatch(/^[A-Za-z0-9_-]{7}$/u)
    }
    // 500 draws from 64^7 — a collision here would be astronomically unlikely.
    expect(new Set(codes).size).toBe(codes.length)
  })
})
