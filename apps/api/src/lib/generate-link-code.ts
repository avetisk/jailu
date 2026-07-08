import { randomBytes } from "node:crypto"

import { LINK_CODE_LENGTH } from "@jailu/shared"

// The URL-safe base64 alphabet. ALPHA_LENGTH must divide 256 (64 does) so `byte %
// ALPHA_LENGTH` is unbiased — no rejection sampling needed.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
const ALPHA_LENGTH = ALPHABET.length

// LINK_CODE_LENGTH base64url chars => 64^7 ≈ 4.4e12 codes: non-enumerable; collisions are
// handled by the unique index + retry on insert. `charAt` (not `[i]`) keeps the
// accumulator a `string` under noUncheckedIndexedAccess.
export const generateLinkCode = (): string =>
  randomBytes(LINK_CODE_LENGTH).reduce(
    (code, byte) => code + ALPHABET.charAt(byte % ALPHA_LENGTH),
    "",
  )
