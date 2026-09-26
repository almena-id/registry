import "server-only";

import { cookies, headers } from "next/headers";

import { defaultTimeZone, isTimeZone, timeZoneCookie } from "@/app/lib/timezone";
import { defaultLocale, dictionaries, isLocale, localeCookie, type Locale } from "./config";

/**
 * The language to render in: the one chosen in the selector, else the
 * browser's (Accept-Language, full tag then its language subtag), else English.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(localeCookie)?.value;
  if (isLocale(chosen)) return chosen;

  const accept = (await headers()).get("accept-language") ?? "";
  const tags = accept
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => Boolean(tag));
  for (const tag of tags) {
    if (isLocale(tag)) return tag;
    const language = tag.split("-")[0];
    if (isLocale(language)) return language;
  }
  return defaultLocale;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

/**
 * The zone dates and times are rendered in: the visitor's explicit choice,
 * otherwise UTC. The server cannot ask the browser, so the selector is what
 * moves a visitor off UTC (it offers the browser's zone first).
 */
export async function getTimeZone(): Promise<string> {
  const chosen = (await cookies()).get(timeZoneCookie)?.value;
  return isTimeZone(chosen) ? chosen : defaultTimeZone;
}
