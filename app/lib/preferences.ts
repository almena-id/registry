"use server";

import { cookies } from "next/headers";

import { isLocale, localeCookie } from "@/app/i18n/config";
import { isTheme, themeCookie } from "./theme";

const oneYear = 60 * 60 * 24 * 365;

export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(localeCookie, locale, {
    maxAge: oneYear,
    sameSite: "lax",
  });
}

export async function setTheme(theme: string): Promise<void> {
  if (!isTheme(theme)) return;
  (await cookies()).set(themeCookie, theme, {
    maxAge: oneYear,
    sameSite: "lax",
  });
}
