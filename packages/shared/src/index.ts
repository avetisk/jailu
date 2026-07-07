// Flat, single-value schemas shared by the client forms and the API request schemas
// (urlSchema, emailSchema, codeSchema, ...). The first citizens arrive with the
// validation slice. Object and request/response contracts do NOT live here — those come
// from the API via Hono RPC.
export {}
