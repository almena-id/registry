/**
 * Texts by language, `{ en: …, es: … }`, as the API keeps a form's name and
 * description, its fields' help and its credentials' purposes, and the
 * labels of the tenant's own fields. Shared by client and server.
 */

import type { Locale } from "@/app/i18n/config";

export type Texts = Partial<Record<Locale, string>>;

/** Whether any language has text. */
export function hasText(value: Texts | undefined | null): boolean {
  return Object.values(value ?? {}).some((text) => text?.trim());
}

/** The texts trimmed, the empty ones dropped. */
export function cleanTexts(value: Texts | undefined | null): Texts {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .map(([lang, text]) => [lang, (text ?? "").trim()])
      .filter(([, text]) => text),
  );
}

/** Texts read from a form's hidden input (JSON); none when unreadable. */
export function textsFrom(raw: FormDataEntryValue | null): Texts {
  try {
    const parsed: unknown = JSON.parse(String(raw ?? "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? cleanTexts(parsed as Texts)
      : {};
  } catch {
    return {};
  }
}

/** The longest of them, to hold them to a limit. */
export function longest(value: Texts): number {
  return Math.max(0, ...Object.values(value).map((text) => text?.length ?? 0));
}
