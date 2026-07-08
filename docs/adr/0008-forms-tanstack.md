# ADR-0008 — Forms via @tanstack/react-form

Status: accepted

Decision: Client forms use `@tanstack/react-form`, not react-hook-form. Validation runs through
standard-schema, so the shared zod schemas (`shortenableUrlSchema`) and their error codes
(ADR-0007) plug in directly — one schema drives both the form and the API, no resolver adapter.

Why: react-hook-form's maintenance has slowed and it lagged on the latest zod; TanStack Form is
fresher, actively maintained, and its standard-schema validation is a clean fit for the shared
schemas.

Rejected: react-hook-form (waning maintenance, zod-compat lag, needs a resolver adapter); a
bespoke form layer (reinvents validation and state for no gain).
