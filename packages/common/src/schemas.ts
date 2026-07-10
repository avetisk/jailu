import z from "zod"

export const portSchema = z.coerce.number().positive().max(65335)

// Technically you can start with a number too, but we don't want to handle weird stuff and break things. Actually no one wants that.
export const dbNameSchema = z.string().regex(/^[a-z][a-z0-9_-]*$/u)

export const shortenableUrlSchema = z.url({
  protocol: /^https?$/iu,
  // Real IP regex is much larger, using this one as a "demo"
  hostname: /^(?!localhost$)(?!\d+\.\d+\.\d+\.\d+$)[a-z0-9.-]+\.[a-z0-9.-]+$/iu,
  error: "Invalid url.",
})

export const shortLinkCodeSchema = z
  .string()
  // Fail fast
  .length(7)
  .regex(/^[a-z0-9_-]{7}$/iu)
