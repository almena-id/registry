/**
 * Time zone preference, shared by server and client code (the same shape as
 * almena-id/frontend's `lib/timezone.ts`). Kept free of server-only imports so
 * client components can use it too.
 */

/** Fallback zone: locale-neutral, and the one the API speaks. */
export const defaultTimeZone = "UTC";

/** Cookie holding the zone the visitor picked explicitly. */
export const timeZoneCookie = "almena.timezone";

/**
 * IANA identifiers this runtime can format, e.g. `Europe/Madrid`. Browsers
 * leave `UTC` out of their list; it is added so the default can be picked back.
 */
export function listTimeZones(): readonly string[] {
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes(defaultTimeZone) ? zones : [defaultTimeZone, ...zones];
}

export function isTimeZone(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The zone the browser reports, offered as a suggestion in the selector. */
export function detectTimeZone(): string | null {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isTimeZone(detected) ? detected : null;
}

/** `Europe/Madrid` reads as `Madrid` in the compact trigger. */
export function timeZoneCity(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

/** `Europe/Madrid` reads as `Europe / Madrid` in the list. */
export function timeZoneLabel(timeZone: string): string {
  return timeZone.replace(/_/g, " ").replace(/\//g, " / ");
}

/**
 * Persist the visitor's zone for a year. Browser-only: the server reads the
 * cookie back through `next/headers`. IANA identifiers only use characters a
 * cookie value accepts verbatim, so they are stored unescaped.
 */
export function persistTimeZone(timeZone: string): void {
  document.cookie = `${timeZoneCookie}=${timeZone};path=/;max-age=31536000;samesite=lax`;
}
