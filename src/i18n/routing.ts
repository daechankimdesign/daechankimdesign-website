import { defineRouting } from "next-intl/routing";

/**
 * Controlled locale list — the ONLY place locales are added/removed.
 * English is the default and renders with NO prefix; ko/es use /ko, /es.
 * Slugs are never translated (they stay English across all locales).
 */
export const routing = defineRouting({
  locales: ["en", "ko", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

// Display names for the language dropdown (endonyms).
export const localeNames: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  es: "Español",
};
