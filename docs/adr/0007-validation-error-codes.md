# ADR-0007 — Localizable validation error codes

Status: accepted

Decision: Shared value schemas (`packages/shared`) emit **stable error codes**, not prose — a
failing `shortenableUrlSchema` puts a code like `url.scheme_not_allowed` in the zod issue
`message` (see `errors.ts`). Each consumer maps the code to human text on its own: the web app via
its i18n catalogs (EN + FR), and the API not at all — it returns the code verbatim in the `400`.
`message` carries the code deliberately: it is the only issue field that survives both
standard-schema (how `@tanstack/react-form` reads a schema — it exposes only `{ message, path }`)
and `@hono/zod-validator` (which sees the full error).

Why: the audience is bilingual (EN/FR) and validation must localize on the client form — and
localization is human-interface, which the client owns (ADR-0003). Codes let one schema serve
every locale without the shared layer or the API holding any strings; the API stays a stateless
machine contract with no i18n catalog or `Accept-Language` parsing. A completeness test keeps
every code mapped in both catalogs.

Rejected: prose messages in the schema (a second, un-localizable source of truth — English-only in
a French UI); zod `params` for the code (dropped by standard-schema, so the form never sees it);
API-side localization via `Accept-Language` (puts a human-interface concern in the machine
contract and needs a server catalog).
