// Load the repo-root .env before any test module (and thus @jailu/api/src/db → loadConfig) runs.
// In CI the variables come from the job environment; locally from a copied .env.
import "@jailu/api/src/env"
