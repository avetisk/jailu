import { codeSchema } from "@jailu/shared"
import { describe, expect, it } from "vitest"

import { CODE_LENGTH, generateCode } from "@/lib/code"

describe("generateCode", () => {
  it("mints a base64url code of the expected length", () => {
    const code = generateCode()
    expect(code).toHaveLength(CODE_LENGTH)
    expect(codeSchema.safeParse(code).success).toBe(true)
  })

  it("is effectively unique across many draws (non-enumerable)", () => {
    const codes = Array.from({ length: 500 }, () => generateCode())
    for (const code of codes) {
      expect(code).toMatch(/^[A-Za-z0-9_-]{7}$/u)
    }
    // 500 draws from 64^7 — a collision here would be astronomically unlikely.
    expect(new Set(codes).size).toBe(codes.length)
  })
})
