import type { HealthResponse } from "@jailu/shared"
import { Hono } from "hono"

export const app = new Hono()

app.get("/api/health", (c) => {
  const body: HealthResponse = { status: "ok" }
  return c.json(body)
})
