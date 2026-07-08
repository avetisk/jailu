// Named Postgres error codes (SQLSTATE — Postgres docs, appendix A). The SQL analogue of
// HTTP status codes: referenced by name so data-layer error handling reads intentionally
// and the codes stay reusable across queries.
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
} as const
