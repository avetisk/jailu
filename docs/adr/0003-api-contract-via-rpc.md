# ADR-0003 — API contract via Hono RPC; forms own their schemas

Status: accepted

Decision: The API server is the single source of truth. Request bodies are validated
server-side with zod (`@hono/zod-validator`); request/response types reach the client via
Hono RPC (`hc<AppType>`). Client forms have their own schemas and map to the API payload.

Why: form data is not the API input. Multi-step forms validate per step but send one payload;
fields get re-mapped (a selected country becomes entity IDs). Sharing a form/API schema is
wrong, and a hand-written shared contract is redundant when RPC derives types from the server.

Rejected: a shared contract package (ceremony, no payoff for a single TypeScript client in one
repo); sharing form schemas with the API (form logic is arbitrary client business logic).
