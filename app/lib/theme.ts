/**
 * Light, dark, or whatever the system is doing. `system` is not a palette:
 * it leaves `prefers-color-scheme` to answer. The choice lives in a cookie so
 * the server renders `data-theme` and the page never flashes the wrong one.
 */
export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];
export const defaultTheme: Theme = "system";
export const themeCookie = "almena.theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (themes as readonly string[]).includes(value);
}
