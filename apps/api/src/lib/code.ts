import { randomBytes } from "node:crypto"

// The URL-safe base64 alphabet (64 chars). 7 chars => 64^7 ≈ 4.4e12 codes:
// non-enumerable, and collisions are handled by the unique index + retry on insert.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

export const CODE_LENGTH = 7

// Each random byte maps to an alphabet index via `% 64`. 256 is a multiple of 64, so
// every character is equally likely — no modulo bias, no rejection sampling needed.
export function generateCode(): string {
  let code = ""
  for (const byte of randomBytes(CODE_LENGTH)) {
    code += ALPHABET.charAt(byte % 64)
  }
  return code
}
