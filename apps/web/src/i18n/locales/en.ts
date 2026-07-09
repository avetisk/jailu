// English catalog. `errors.url.*` keys mirror the shared URL_ERROR codes (ADR-0007): a code
// like "url.scheme_not_allowed" resolves via t(`errors.${code}`). The i18n-completeness test
// enforces that this catalog and fr.ts cover exactly the URL_ERROR code set — no gaps, no orphans.
export const en = {
  app: {
    title: "jai.lu",
    tagline: "shorter is better",
    language: "Language",
  },
  form: {
    url_label: "URL to shorten",
    url_placeholder: "https://example.com/a/very/long/link",
    submit: "Shorten",
    submitting: "Shortening…",
    success_title: "Your short link",
    copy: "Copy",
    copied: "Copied",
    reset: "Shorten another",
  },
  errors: {
    request_failed: "Something went wrong. Please try again.",
    url: {
      empty: "Enter a URL to shorten.",
      too_long: "That URL is too long.",
      malformed: "That doesn't look like a valid URL.",
      scheme_not_allowed: "Only http and https URLs can be shortened.",
      credentials_present: "Remove the username and password from the URL.",
      self_host: "That's already a jai.lu link.",
      localhost: "localhost URLs can't be shortened.",
      ip_host: "IP-address URLs can't be shortened.",
      no_public_tld: "Use a public domain with a valid TLD.",
    },
  },
} as const
