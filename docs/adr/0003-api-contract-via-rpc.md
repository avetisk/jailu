# ADR-0003 — API contract via Hono RPC; forms own their schemas

Status: accepted

Decision: The API server is the single source of truth. Request bodies are validated
server-side with zod (`@hono/zod-validator`); request/response types reach the client via
Hono RPC (`hc<AppType>`). Client forms have their own schemas and map to the API payload.
Only flat single-value schemas are shared, in `packages/shared` (ADR-0001). Shared-schema
validation failures cross as stable codes the client localizes (ADR-0007).

Why: form data is not the API input. Multi-step forms validate per step but send one payload;
fields get re-mapped (a selected country becomes entity IDs). Sharing a form/API _object_ schema
is wrong, and a hand-written object contract is redundant when RPC derives types from the server.

Rejected: a shared _object_ contract package (ceremony, redundant with RPC); sharing form
schemas with the API (form logic is arbitrary client business logic).
