import type { Dictionary } from "@/app/i18n/config";

type ErrorKey = keyof Dictionary["dashboard"]["account"]["errors"];

/** The API's (or the provider round trip's) error codes, as the page's texts. */
const CODES: Record<string, ErrorKey> = {
  last_way_in: "lastWayIn",
  invalid_state: "invalidState",
  provider_error: "providerError",
  provider_cancelled: "providerCancelled",
  invalid_ticket: "invalidTicket",
  not_empty: "notEmpty",
};

export function accountError(code: string | string[] | undefined): ErrorKey | null {
  if (typeof code !== "string" || !code) return null;
  return CODES[code] ?? "unavailable";
}
