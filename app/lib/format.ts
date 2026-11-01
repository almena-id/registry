/**
 * Dates and times, shared by server and client code.
 *
 * A moment is always written the way the locale writes one, in the time zone
 * the visitor chose: never hand-assembled, because the locale decides the
 * order of the parts and the words between them.
 */
export function formatDateTime(
  value: string | Date,
  locale: string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(typeof value === "string" ? new Date(value) : value);
}

/**
 * A calendar day the API counts in UTC (`YYYY-MM-DD`), written the locale's
 * way: never shifted into the visitor's zone, which could name the day
 * before. `short`: day and month only, for a chart's axis.
 */
export function formatDay(
  day: string,
  locale: string,
  style: "short" | "long" = "long",
): string {
  return new Intl.DateTimeFormat(
    locale,
    style === "short"
      ? { day: "numeric", month: "short", timeZone: "UTC" }
      : { dateStyle: "medium", timeZone: "UTC" },
  ).format(new Date(`${day}T00:00:00Z`));
}
