import "server-only";

import { cookies } from "next/headers";

import { defaultTheme, isTheme, themeCookie, type Theme } from "./theme";

export async function getTheme(): Promise<Theme> {
  const stored = (await cookies()).get(themeCookie)?.value;
  return isTheme(stored) ? stored : defaultTheme;
}
