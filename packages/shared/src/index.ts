// Public barrel for @jailu/shared — value schemas + the cross-package constants. The URL
// utilities and validation constants stay internal (not re-exported).
// (import-then-export, not `export {…} from`, to dodge an oxlint no-duplicate-imports
// false positive on multi-specifier re-exports.)
import { HTTP_STATUS, LINK_CODE_LENGTH } from "@jailu/shared/src/constants"

export * from "@jailu/shared/src/schemas"
export { HTTP_STATUS, LINK_CODE_LENGTH }
