import { withUniqueCode } from "@jailu/api/src/links/unique-code"
// These tests intentionally reject with non-Error values to exercise the
// isUniqueViolation type guard, so prefer-promise-reject-errors is disabled here.
/* eslint-disable prefer-promise-reject-errors */
import { describe, expect, it } from "vitest"

const uniqueViolation = { code: "23505" }

function expectRethrow(err: unknown): Promise<void> {
  return expect(withUniqueCode(() => Promise.reject(err))).rejects.toBe(err)
}

describe("withUniqueCode", () => {
  it("returns the first successful attempt", async () => {
    const result = await withUniqueCode(
      (code) => Promise.resolve(`ok:${code}`),
      () => "aaaaaaa",
    )
    expect(result).toBe("ok:aaaaaaa")
  })

  it("retries past collisions until one succeeds", async () => {
    let calls = 0
    const result = await withUniqueCode((code) => {
      calls += 1
      if (calls < 3) {
        return Promise.reject(uniqueViolation)
      }
      return Promise.resolve(code)
    })
    expect(calls).toBe(3)
    expect(result).toHaveLength(7)
  })

  it("gives up after exhausting attempts on repeated collisions", async () => {
    await expect(withUniqueCode(() => Promise.reject(uniqueViolation))).rejects.toThrow(
      "could not mint a unique code",
    )
  })

  it("rethrows any non-collision error immediately", async () => {
    const nonCollisions: unknown[] = ["boom", null, {}, { code: "42P01" }]
    await Promise.all(nonCollisions.map(expectRethrow))
  })
})
