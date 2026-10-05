/**
 * Locales of the portal. English is the source language and the fallback:
 * every other catalogue is merged over it, so a missing key reads in English
 * rather than as a blank or a raw key.
 */

import en from "./messages/en.json";
import es from "./messages/es.json";

export type Dictionary = typeof en;

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Each language named in itself, for the selector. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/** Where the chosen language is kept (a year, readable by the server). */
export const localeCookie = "almena.locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

function withFallback<T>(base: T, override: unknown): T {
  if (
    override === null ||
    typeof override !== "object" ||
    Array.isArray(override)
  ) {
    return base;
  }
  const source = override as Record<string, unknown>;
  const merged: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
    if (!(key in source)) continue;
    merged[key] =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? withFallback(value, source[key])
        : (source[key] ?? value);
  }
  return merged as T;
}

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  es: withFallback(en, es),
};
