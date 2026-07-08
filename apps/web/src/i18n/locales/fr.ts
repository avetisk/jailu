// Catalogue français. Voir en.ts pour la convention des clés `errors.url.*` (ADR-0007) ; le
// test i18n-completeness garantit que ce catalogue couvre exactement l'ensemble des codes URL_ERROR.
export const fr = {
  app: {
    title: "jailu",
    tagline: "Un raccourcisseur d'URL, construit tranche par tranche.",
    language: "Langue",
  },
  errors: {
    url: {
      empty: "Saisissez une URL à raccourcir.",
      too_long: "Cette URL est trop longue.",
      malformed: "Cela ne ressemble pas à une URL valide.",
      scheme_not_allowed: "Seules les URL http et https peuvent être raccourcies.",
      credentials_present: "Retirez le nom d'utilisateur et le mot de passe de l'URL.",
      self_host: "C'est déjà un lien jai.lu.",
      localhost: "Les URL localhost ne peuvent pas être raccourcies.",
      ip_host: "Les URL en adresse IP ne peuvent pas être raccourcies.",
      no_public_tld: "Utilisez un domaine public avec un TLD valide.",
    },
  },
} as const
