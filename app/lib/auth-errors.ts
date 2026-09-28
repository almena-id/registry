import type { Dictionary } from "@/app/i18n/config";

type ErrorKey = keyof Dictionary["auth"]["errors"];

/** A social sign-in that came back to `/login?error=…`, as the form shows it. */
export function socialError(code: string | undefined): ErrorKey | undefined {
  if (!code) return undefined;
  const known: Record<string, ErrorKey> = {
    invalid_state: "invalidState",
    email_unverified: "emailUnverified",
    provider_error: "providerError",
    provider_disabled: "providerError",
    provider_cancelled: "providerCancelled",
  };
  return known[code] ?? "unavailable";
}
