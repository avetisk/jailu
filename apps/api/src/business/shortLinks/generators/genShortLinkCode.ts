import { randomBytes } from "node:crypto"

import { SHORT_LINK_CODE_LENGTH } from "@jailu/common/constants"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
const ALPHABET_LENGTH = ALPHABET.length

export const genShortLinkCode = () =>
  randomBytes(SHORT_LINK_CODE_LENGTH).reduce(
    (shortLinkCode, byte) => shortLinkCode + ALPHABET.charAt(byte % ALPHABET_LENGTH),
    "",
  )
