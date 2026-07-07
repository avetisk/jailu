// Shared API contract between the web client and the API server.
// Real schemas (zod) land in the core slice; this is the type seam.

export type HealthResponse = {
  status: "ok"
}
