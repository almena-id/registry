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
