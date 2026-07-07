# ADR-0004 — Link destinations are immutable

Status: accepted

Decision: A link's `originalUrl` cannot change after creation. `PATCH /api/links/:id` only
toggles `disabled` and sets `expiresAt` — never the target.

Why: a mutable destination is a phishing primitive — share an innocent short link, let it
spread, then swap it to a malicious target. Immutability removes that class of abuse and lets
the redirect cache treat entries as safe to keep.

Rejected: editable destinations (bait-and-switch); "edit = silently repoint" (leaves the
already-shared code pointing somewhere new).
