import { cn } from "@jailu/web/src/lib/utils"
import { describe, expect, it } from "vitest"

describe("cn", () => {
  it("drops falsy classes and dedupes conflicting tailwind utilities", () => {
    expect(cn("px-2", false, "px-4")).toBe("px-4")
    expect(cn("text-sm", null, "font-medium")).toBe("text-sm font-medium")
  })
})
