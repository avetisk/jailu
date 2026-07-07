import { Hono } from "hono"

// The API is the single source of truth for the contract.
// Routes are chained so `AppType` carries end-to-end types to the client via Hono RPC.
export const app = new Hono().get("/api/health", (c) => c.json({ status: "ok" }))

export type AppType = typeof app
