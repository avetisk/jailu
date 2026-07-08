// Cross-cutting domain constants used by more than one package. One file for now — split
// it if it grows. Values that only one package consumes stay in that package.

// Length of a minted short code. The API mints exactly this many base64url chars; the
// client uses it for validation and display.
export const LINK_CODE_LENGTH = 7
